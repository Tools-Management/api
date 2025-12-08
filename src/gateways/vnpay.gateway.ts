/**
 * VNPay Payment Gateway Implementation
 * Implements secure payment processing với VNPay
 */

import crypto from "crypto";
import axios from "axios";
import { VNPAY_CONFIG, getVNPayConfig } from "@/config/vnpay.config";
import { formatVNPayDate } from "@/utils/vnpay.utils";
import {
  IPaymentGateway,
  PaymentStatus,
  PaymentVerificationResult,
  GatewayRefundOptions,
  PaymentRefundResult,
} from "@/types/payment-gateway";
import { VNPAY_RESPONSE_CODES } from "@/constants/vnpay";
import moment from "moment";

/**
 * VNPay base parameters (before signing)
 */
interface VNPayBaseParams {
  vnp_Version: string;
  vnp_Command: string;
  vnp_TmnCode: string;
  vnp_Amount: number;
  vnp_CurrCode: string;
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_ReturnUrl: string;
  vnp_IpAddr: string;
  vnp_CreateDate: string;
  vnp_Locale?: string;
  vnp_BankCode?: string;
  vnp_ExpireDate?: string;
}

/**
 * VNPay signed parameters (includes hash)
 */
interface VNPaySignedParams extends VNPayBaseParams {
  vnp_SecureHash: string;
}

/**
 * Normalizes and sorts object entries for VNPay signature
 */
const normalizeEntries = (
  params: Record<string, unknown>
): [string, string][] =>
  Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .map(([key, value]) => [key, String(value)] as [string, string])
    .sort(([a], [b]) => (a > b ? 1 : -1));

/**
 * VNPay Gateway Implementation
 */
export class VNPayGateway implements IPaymentGateway {
  private config: ReturnType<typeof getVNPayConfig>;

  constructor() {
    this.config = getVNPayConfig();
  }

  getName(): string {
    return "VNPay";
  }

  /**
   * Generate HMAC SHA512 signature
   */
  private generateSignature(params: Record<string, unknown>): string {
    const orderedEntries = normalizeEntries(params);
    const canonical = orderedEntries.map(([k, v]) => `${k}=${v}`).join("&");

    const signature = crypto
      .createHmac("sha512", this.config.hashSecret)
      .update(Buffer.from(canonical, "utf-8"))
      .digest("hex");

    return signature;
  }

  /**
   * Sign VNPay parameters
   */
  private signParams(baseParams: VNPayBaseParams): VNPaySignedParams {
    // Convert to Record for signing (remove any existing hash)
    const cleanParams: Record<string, unknown> = { ...baseParams };
    delete cleanParams["vnp_SecureHash"];
    delete cleanParams["vnp_SecureHashType"];

    const orderedEntries = normalizeEntries(cleanParams);
    const canonical = orderedEntries.map(([k, v]) => `${k}=${v}`).join("&");

    console.log("🔍 CANONICAL STRING =", canonical);

    const signature = this.generateSignature(cleanParams);

    return {
      ...baseParams,
      vnp_SecureHash: signature,
    };
  }

  /**
   * Build URL search params
   */
  private buildSearchParams = (params: VNPaySignedParams) => {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        return `${k}=${k === "vnp_ReturnUrl" ? v : encodeURIComponent(v)}`;
      })
      .join("&");
  };

  /**
   * Verify VNPay callback signature
   */
  private verifySignature(
    data: Record<string, unknown>,
    receivedHash: string
  ): boolean {
    try {
      // Remove hash from data before verification
      const dataForVerification = Object.entries(data).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (
          key !== "vnp_SecureHash" &&
          key !== "vnp_SecureHashType" &&
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const expectedHash = this.generateSignature(dataForVerification);
      return expectedHash === receivedHash;
    } catch (error) {
      console.error("[VNPayGateway] Signature verification error:", error);
      return false;
    }
  }

  /**
   * Create VNPay payment URL
   */
  async createPaymentUrl(
    orderRef: string,
    amount: number,
    orderInfo: string,
    additionalData: Record<string, string | number> = {}
  ): Promise<string> {
    try {
      const createDate = formatVNPayDate();

      // Build base parameters
      const baseParams: VNPayBaseParams = {
        vnp_Version: VNPAY_CONFIG.VERSION,
        vnp_Command: VNPAY_CONFIG.COMMAND.PAY,
        vnp_TmnCode: this.config.tmnCode,
        vnp_Locale: String(additionalData["locale"] || "vn"),
        vnp_CurrCode: VNPAY_CONFIG.CURRENCY_CODE,
        vnp_TxnRef: orderRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: VNPAY_CONFIG.ORDER_TYPE.TOPUP,
        vnp_Amount: Math.round(amount * VNPAY_CONFIG.AMOUNT_MULTIPLIER),
        vnp_ReturnUrl: this.config.returnUrl,
        vnp_IpAddr: (() => {
          let ip = String(additionalData["ipAddress"] || "127.0.0.1");
          if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
          return ip;
        })(),
        vnp_CreateDate: createDate,
        vnp_ExpireDate: String(additionalData["expireDate"] || moment().add(15, 'minutes').format('YYYYMMDDHHmmss')),
      };

      // Add optional parameters
      // if (additionalData["locale"]) {
      //   baseParams.vnp_Locale = String(additionalData["locale"]);
      // }

      if (additionalData["bankCode"]) {
        baseParams.vnp_BankCode = String(additionalData["bankCode"]);
      }

      // if (additionalData["expireDate"]) {
      //   baseParams.vnp_ExpireDate = String(additionalData["expireDate"]);
      // }

      // Sign parameters
      const signedParams = this.signParams(baseParams);

      // Build final URL
      const query = this.buildSearchParams(signedParams);
      const paymentUrl = `${this.config.paymentUrl}?${query}`;

      console.log(`[VNPayGateway] Payment URL created for order: ${orderRef}`);

      return paymentUrl;
    } catch (error) {
      console.error("[VNPayGateway] Error creating payment URL:", error);
      throw new Error("Failed to create VNPay payment URL");
    }
  }

  /**
   * Verify VNPay callback
   */
  async verifyCallback(
    data: Record<string, unknown>
  ): Promise<PaymentVerificationResult> {
    try {
      const receivedHash = String(data["vnp_SecureHash"] || "");
      const isValid = this.verifySignature(data, receivedHash);

      if (!isValid) {
        return {
          isValid: false,
          status: PaymentStatus.FAILED,
          merchantOrderRef: String(data["vnp_TxnRef"] || ""),
          message: "Invalid VNPay signature",
          gatewayResponseData: data,
        };
      }

      // Map VNPay response code to payment status
      const responseCode = String(data["vnp_ResponseCode"] || "");
      const status =
        responseCode === VNPAY_RESPONSE_CODES.SUCCESS
          ? PaymentStatus.COMPLETED
          : PaymentStatus.FAILED;

      const result: PaymentVerificationResult = {
        isValid: true,
        status,
        merchantOrderRef: String(data["vnp_TxnRef"] || ""),
        gatewayTransactionNo: String(data["vnp_TransactionNo"] || ""),
        message: isValid
          ? "VNPay callback verified successfully"
          : "VNPay payment failed",
        gatewayResponseData: data,
      };

      console.log(
        `[VNPayGateway] Callback verified for order: ${result.merchantOrderRef}, Status: ${status}`
      );

      return result;
    } catch (error) {
      console.error("[VNPayGateway] Error verifying callback:", error);
      return {
        isValid: false,
        status: PaymentStatus.FAILED,
        merchantOrderRef: String(data["vnp_TxnRef"] || ""),
        message: "Callback verification failed",
        gatewayResponseData: data,
      };
    }
  }

  /**
   * Refund a VNPay payment
   */
  async refundPayment(
    orderRef: string,
    gatewayTransactionNo: string,
    options: GatewayRefundOptions
  ): Promise<PaymentRefundResult> {
    try {
      if (!this.config.apiUrl) {
        throw new Error("VNPay API URL not configured for refunds");
      }

      const refundAmount = Math.round(
        options.amount * VNPAY_CONFIG.AMOUNT_MULTIPLIER
      );

      const baseParams: Record<string, string | number> = {
        vnp_RequestId: `${Date.now()}`,
        vnp_Version: VNPAY_CONFIG.VERSION,
        vnp_Command: VNPAY_CONFIG.COMMAND.REFUND,
        vnp_TmnCode: this.config.tmnCode,
        vnp_TransactionType: "02",
        vnp_TxnRef: orderRef,
        vnp_Amount: refundAmount,
        vnp_TransactionNo: gatewayTransactionNo,
        vnp_OrderInfo: options.reason || `Refund for ${orderRef}`,
        vnp_TransactionDate: formatVNPayDate(),
        vnp_CreateBy: options.performedBy || "system",
        vnp_CreateDate: formatVNPayDate(),
        vnp_IpAddr: options.ipAddress || "127.0.0.1",
      };

      // Sign the refund request
      const signature = this.generateSignature(baseParams);
      const signedPayload = {
        ...baseParams,
        vnp_SecureHash: signature,
      };

      // Build request body
      const body = new URLSearchParams(
        normalizeEntries(signedPayload)
      ).toString();

      // Send refund request
      const response = await axios.post(this.config.apiUrl, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      });

      const responseData =
        (response?.data as Record<string, unknown>) ||
        ({} as Record<string, unknown>);
      const isSuccess =
        String(responseData["vnp_ResponseCode"]) ===
        VNPAY_RESPONSE_CODES.SUCCESS;

      if (!isSuccess) {
        console.error("[VNPayGateway] Refund failed:", responseData);
      } else {
        console.log(`[VNPayGateway] Refund successful for order: ${orderRef}`);
      }

      return {
        isSuccess,
        transactionId: String(responseData["vnp_TransactionNo"] || ""),
        gatewayResponseData: responseData,
        message: isSuccess ? "Refund processed successfully" : "Refund failed",
      };
    } catch (error) {
      console.error("[VNPayGateway] Error processing refund:", error);
      return {
        isSuccess: false,
        gatewayResponseData: { error: String(error) },
        message: "Refund request failed",
      };
    }
  }
}

export default VNPayGateway;
