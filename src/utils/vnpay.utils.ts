/**
 * VNPay Utility Functions
 * Handle signature generation, verification, và data processing
 */

import crypto from "crypto";
import { VNPAY_CONFIG, getVNPayConfig } from "@/config/vnpay.config";
import { IVNPayResponse, IRequestWithIP } from "@/types";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Ho_Chi_Minh");
/**
 * Sort object keys alphabetically
 * VNPay requires params to be sorted for signature generation
 */
export const sortObject = (
  obj: Record<string, string | number | boolean>
): Record<string, string> => {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, "+");
  }

  return sorted;
};

/**
 * Generate VNPay secure hash
 */
export const generateSecureHash = (
  params: Record<string, string | number | boolean>,
  secretKey: string
): string => {
  // Remove hash fields if present
  const cleanParams = { ...params };
  delete cleanParams["vnp_SecureHash"];
  delete cleanParams["vnp_SecureHashType"];

  // Sort and stringify
  const sortedParams = sortObject(cleanParams);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join("&");

  // Create HMAC SHA512
  const hmac = crypto.createHmac(VNPAY_CONFIG.HASH_ALGORITHM, secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return signed;
};

/**
 * Verify VNPay signature from callback/IPN
 */
export const verifyVNPaySignature = (
  params: Record<string, string | number | boolean>,
  receivedHash: string
): boolean => {
  try {
    const { hashSecret } = getVNPayConfig();
    const calculatedHash = generateSecureHash(params, hashSecret);

    return calculatedHash === receivedHash;
  } catch (error) {
    console.error("Error verifying VNPay signature:", error);
    return false;
  }
};

/**
 * Generate unique topup code
 * Format: TOPUP_YYYYMMDD_RANDOMSTRING
 */
export const generateTopupCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `TOPUP_${dateStr}_${randomStr}`;
};

/**
 * Generate unique order code
 * Format: ORDER_YYYYMMDD_RANDOMSTRING
 */
export const generateOrderCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `ORDER_${dateStr}_${randomStr}`;
};

/**
 * Format date for VNPay (yyyyMMddHHmmss)
 */
export const formatVNPayDate = (): string => {
  return moment().format("YYYYMMDDHHmmss");
};

/**
 * Parse VNPay date to JavaScript Date
 */
export const parseVNPayDate = (vnpDate: string): Date | null => {
  try {
    if (!vnpDate || vnpDate.length !== 14) {
      return null;
    }

    const year = parseInt(vnpDate.slice(0, 4));
    const month = parseInt(vnpDate.slice(4, 6)) - 1;
    const day = parseInt(vnpDate.slice(6, 8));
    const hours = parseInt(vnpDate.slice(8, 10));
    const minutes = parseInt(vnpDate.slice(10, 12));
    const seconds = parseInt(vnpDate.slice(12, 14));

    return new Date(year, month, day, hours, minutes, seconds);
  } catch (error) {
    console.error("Error parsing VNPay date:", error);
    return null;
  }
};

/**
 * Convert amount to VNPay format (VND to xu)
 * VNPay requires amount in xu (1 VND = 100 xu)
 */
export const toVNPayAmount = (amount: number): number => {
  return amount * VNPAY_CONFIG.AMOUNT_MULTIPLIER;
};

/**
 * Convert amount from VNPay format (xu to VND)
 */
export const fromVNPayAmount = (vnpAmount: number): number => {
  return Math.floor(vnpAmount / VNPAY_CONFIG.AMOUNT_MULTIPLIER);
};

/**
 * Validate topup amount
 */
export const validateTopupAmount = (
  amount: number
): { isValid: boolean; error?: string } => {
  if (!amount || amount <= 0) {
    return { isValid: false, error: "Số tiền phải lớn hơn 0" };
  }

  if (amount < VNPAY_CONFIG.MIN_TOPUP_AMOUNT) {
    return {
      isValid: false,
      error: `Số tiền tối thiểu là ${VNPAY_CONFIG.MIN_TOPUP_AMOUNT.toLocaleString(
        "vi-VN"
      )} VNĐ`,
    };
  }

  if (amount > VNPAY_CONFIG.MAX_TOPUP_AMOUNT) {
    return {
      isValid: false,
      error: `Số tiền tối đa là ${VNPAY_CONFIG.MAX_TOPUP_AMOUNT.toLocaleString(
        "vi-VN"
      )} VNĐ`,
    };
  }

  return { isValid: true };
};

/**
 * Get client IP address from request
 */
export const getClientIp = (req: IRequestWithIP): string => {
  const forwarded = req.headers["x-forwarded-for"];

  // Try to get IP from various sources, default to 0.0.0.0
  let ip: string = "0.0.0.0";

  if (typeof forwarded === "string" && forwarded) {
    ip = forwarded as string;
  } else if (req.ip) {
    ip = req.ip as string;
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress as string;
  } else if (req.connection?.remoteAddress) {
    ip = req.connection.remoteAddress as string;
  }

  // Extract first IP from comma-separated list
  const firstIp = String(ip).split(",")[0];
  return firstIp ? firstIp.trim() : "0.0.0.0";
};

/**
 * Sanitize VNPay response data
 * Remove sensitive information for logging
 */
export const sanitizeVNPayResponse = (
  response: IVNPayResponse
): Partial<IVNPayResponse> => {
  // Use destructuring to omit sensitive fields (safer than delete)
  const { vnp_SecureHash, ...sanitized } = response;
  void vnp_SecureHash; // Suppress unused variable warning
  return sanitized;
};
/**
 * Check if transaction is in final state
 */
export const isFinalState = (status: string): boolean => {
  return ["completed", "failed", "refunded", "cancelled"].includes(status);
};

/**
 * Build VNPay payment URL
 */
export const buildVNPayUrl = (
  params: Record<string, string | number>
): string => {
  const { paymentUrl } = getVNPayConfig();
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return `${paymentUrl}?${queryString}`;
};

export default {
  sortObject,
  generateSecureHash,
  verifyVNPaySignature,
  generateTopupCode,
  generateOrderCode,
  formatVNPayDate,
  parseVNPayDate,
  toVNPayAmount,
  fromVNPayAmount,
  validateTopupAmount,
  getClientIp,
  sanitizeVNPayResponse,
  isFinalState,
  buildVNPayUrl,
};
