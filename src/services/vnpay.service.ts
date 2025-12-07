/**
 * VNPay Service
 * Handle all VNPay payment gateway interactions
 */

import { VNPAY_CONFIG, getVNPayConfig } from '@/config/vnpay.config';
import { 
  generateSecureHash, 
  verifyVNPaySignature,
  formatVNPayDate,
  toVNPayAmount,
  buildVNPayUrl,
  sortObject
} from '@/utils/vnpay.utils';
import { VNPAY_RESPONSE_CODES, isVNPaySuccess } from '@/constants/vnpay';

export interface ICreatePaymentUrlParams {
  topupCode: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
  bankCode?: string;
  locale?: 'vn' | 'en';
}

export interface IVNPayCallbackResult {
  isValid: boolean;
  isSuccess: boolean;
  topupCode: string;
  amount: number;
  responseCode: string;
  transactionNo: string;
  bankCode: string;
  bankTranNo: string;
  cardType: string;
  payDate: string;
  orderInfo: string;
  error?: string;
}

export class VNPayService {
  /**
   * Tạo URL thanh toán VNPay
   */
  static createPaymentUrl(params: ICreatePaymentUrlParams): string {
    try {
      const config = getVNPayConfig();
      const createDate = formatVNPayDate();
      
      // Build VNPay params theo spec
      const vnpParams: Record<string, string | number> = {
        vnp_Version: VNPAY_CONFIG.VERSION,
        vnp_Command: VNPAY_CONFIG.COMMAND.PAY,
        vnp_TmnCode: config.tmnCode,
        vnp_Locale: params.locale || VNPAY_CONFIG.LOCALE.VN,
        vnp_CurrCode: VNPAY_CONFIG.CURRENCY_CODE,
        vnp_TxnRef: params.topupCode, // Sử dụng topupCode làm transaction reference
        vnp_OrderInfo: params.orderInfo,
        vnp_OrderType: VNPAY_CONFIG.ORDER_TYPE.TOPUP,
        vnp_Amount: toVNPayAmount(params.amount), // Convert to xu
        vnp_ReturnUrl: config.returnUrl,
        vnp_IpAddr: params.ipAddress,
        vnp_CreateDate: createDate,
      };
      
      // Add bank code if specified
      if (params.bankCode) {
        vnpParams['vnp_BankCode'] = params.bankCode;
      }
      
      // Sort params
      const sortedParams = sortObject(vnpParams);
      
      // Generate secure hash
      const secureHash = generateSecureHash(sortedParams, config.hashSecret);
      sortedParams['vnp_SecureHash'] = secureHash;
      
      // Build final URL
      const paymentUrl = buildVNPayUrl(sortedParams);
      
      console.log('VNPay Payment URL created:', {
        topupCode: params.topupCode,
        amount: params.amount,
        url: paymentUrl.substring(0, 100) + '...'
      });
      
      return paymentUrl;
    } catch (error) {
      console.error('Error creating VNPay payment URL:', error);
      throw new Error('Failed to create payment URL');
    }
  }

  /**
   * Verify và parse VNPay callback response
   */
  static verifyCallback(queryParams: Record<string, string | string[]>): IVNPayCallbackResult {
    try {
      const secureHash = String(queryParams['vnp_SecureHash'] || '');
      
      // Convert query params to proper format for verification
      const paramsForVerification: Record<string, string | number | boolean> = {};
      Object.keys(queryParams).forEach(key => {
        const value = queryParams[key];
        if (Array.isArray(value)) {
          paramsForVerification[key] = value[0] || '';
        } else if (value !== undefined) {
          paramsForVerification[key] = value;
        }
      });
      
      // Verify signature
      const isValidSignature = verifyVNPaySignature(paramsForVerification, secureHash);
      
      if (!isValidSignature) {
        return {
          isValid: false,
          isSuccess: false,
          error: 'Invalid signature',
          topupCode: String(queryParams['vnp_TxnRef'] || ''),
          amount: 0,
          responseCode: '97',
          transactionNo: '',
          bankCode: '',
          bankTranNo: '',
          cardType: '',
          payDate: '',
          orderInfo: '',
        };
      }
      
      // Parse response data
      const responseCode = String(queryParams['vnp_ResponseCode'] || '');
      const isSuccess = isVNPaySuccess(responseCode);
      const amountStr = String(queryParams['vnp_Amount'] || '0');
      const amount = parseInt(amountStr) / VNPAY_CONFIG.AMOUNT_MULTIPLIER;
      
      const result: IVNPayCallbackResult = {
        isValid: true,
        isSuccess,
        topupCode: String(queryParams['vnp_TxnRef'] || ''),
        amount,
        responseCode,
        transactionNo: String(queryParams['vnp_TransactionNo'] || ''),
        bankCode: String(queryParams['vnp_BankCode'] || ''),
        bankTranNo: String(queryParams['vnp_BankTranNo'] || ''),
        cardType: String(queryParams['vnp_CardType'] || ''),
        payDate: String(queryParams['vnp_PayDate'] || ''),
        orderInfo: String(queryParams['vnp_OrderInfo'] || ''),
      };
      
      // Log sanitized response (simplified)
      console.log('VNPay callback verified:', {
        topupCode: result.topupCode,
        amount: result.amount,
        responseCode: result.responseCode,
        transactionNo: result.transactionNo,
      });
      
      return result;
    } catch (error) {
      console.error('Error verifying VNPay callback:', error);
      return {
        isValid: false,
        isSuccess: false,
        error: 'Verification failed',
        topupCode: '',
        amount: 0,
        responseCode: '99',
        transactionNo: '',
        bankCode: '',
        bankTranNo: '',
        cardType: '',
        payDate: '',
        orderInfo: '',
      };
    }
  }

  /**
   * Validate amount matches
   */
  static validateAmount(vnpAmount: number, expectedAmount: number): boolean {
    const actualAmount = fromVNPayAmount(vnpAmount);
    return actualAmount === expectedAmount;
  }

  /**
   * Check if response indicates success
   */
  static isSuccessResponse(responseCode: string): boolean {
    return responseCode === VNPAY_RESPONSE_CODES.SUCCESS;
  }

  /**
   * Check if response indicates failure
   */
  static isFailureResponse(responseCode: string): boolean {
    return responseCode !== VNPAY_RESPONSE_CODES.SUCCESS;
  }
}

/**
 * Helper: Convert VNPay amount (xu) to VND
 */
export const fromVNPayAmount = (vnpAmount: number): number => {
  return Math.floor(vnpAmount / VNPAY_CONFIG.AMOUNT_MULTIPLIER);
};

export default VNPayService;

