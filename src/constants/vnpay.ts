/**
 * VNPay Constants
 * Response codes, messages, and status mappings
 */

/**
 * VNPay Response Codes
 * Ref: https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/
 */
export const VNPAY_RESPONSE_CODES = {
  SUCCESS: '00',
  TRANSACTION_NOT_FOUND: '01',
  TRANSACTION_ALREADY_CONFIRMED: '02',
  INVALID_AMOUNT: '04',
  INVALID_SIGNATURE: '97',
  UNKNOWN_ERROR: '99',
  
  // Payment errors
  TRANSACTION_FAILED: '05',
  USER_CANCELLED: '24',
  INSUFFICIENT_BALANCE: '51',
  ACCOUNT_LOCKED: '65',
  CARD_EXPIRED: '75',
  OTP_INVALID: '79',
} as const;

/**
 * VNPay Response Messages (Tiếng Việt)
 */
export const VNPAY_MESSAGES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '01': 'Không tìm thấy giao dịch',
  '02': 'Giao dịch đã được xác nhận',
  '03': 'Merchant không hợp lệ',
  '04': 'Số tiền không hợp lệ',
  '05': 'Giao dịch thất bại',
  '06': 'Giao dịch bị lỗi',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '08': 'Hệ thống VNPay đang bảo trì',
  '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
  '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
  '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
  '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
  '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
  '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
  '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
  '97': 'Chữ ký không hợp lệ',
  '99': 'Lỗi không xác định',
};

/**
 * Get message for response code
 */
export const getVNPayMessage = (code: string): string => {
  return VNPAY_MESSAGES[code] || VNPAY_MESSAGES['99'] || 'Lỗi không xác định';
};

/**
 * Check if response code indicates success
 */
export const isVNPaySuccess = (code: string): boolean => {
  return code === VNPAY_RESPONSE_CODES.SUCCESS;
};

/**
 * Check if response code indicates failure
 */
export const isVNPayFailure = (code: string): boolean => {
  return code !== VNPAY_RESPONSE_CODES.SUCCESS;
};

/**
 * Check if response code indicates user action (cancel, expired)
 */
export const isUserAction = (code: string): boolean => {
  return ['11', '24'].includes(code); // Timeout or User cancelled
};

/**
 * Check if response code indicates payment system error
 */
export const isSystemError = (code: string): boolean => {
  return ['08', '75', '99'].includes(code);
};

/**
 * Check if response code indicates insufficient funds
 */
export const isInsufficientFunds = (code: string): boolean => {
  return code === '51';
};

/**
 * Check if response code indicates account issue
 */
export const isAccountIssue = (code: string): boolean => {
  return ['09', '10', '12', '65'].includes(code);
};

/**
 * VNPay Bank Codes
 */
export const VNPAY_BANK_CODES = {
  VIETCOMBANK: 'VCB',
  VIETINBANK: 'ICB',
  BIDV: 'BIDV',
  AGRIBANK: 'AGRIBANK',
  SACOMBANK: 'SACOMBANK',
  TECHCOMBANK: 'TCB',
  MBBANK: 'MB',
  ACB: 'ACB',
  VPBANK: 'VPB',
  TPBANK: 'TPB',
  VIETTINBANK: 'VIETTINBANK',
  DONGABANK: 'DAB',
  MARITIMEBANK: 'MSB',
  SEABANK: 'SEAB',
  VIETCAPITALBANK: 'VCCB',
  HDBANK: 'HDB',
  OCB: 'OCB',
  NAMABANK: 'NAB',
  PGBANK: 'PGB',
  VIETBANK: 'VAB',
  SHINHANBANK: 'SHBVN',
  ABBANK: 'ABB',
  LIENVIETPOSTBANK: 'LVPB',
  WOORIBANK: 'WVN',
  KIENLONGBANK: 'KLB',
  BAOVIETBANK: 'BAOVIET',
  PUBLICBANK: 'PBVN',
  GPBANK: 'GPB',
  IVBB: 'IVBB',
  VNMART: 'VNMART', // VNPay QR
} as const;

/**
 * VNPay Card Types
 */
export const VNPAY_CARD_TYPES = {
  ATM: 'ATM',
  CREDIT: 'CREDIT',
  QRCODE: 'QRCODE',
} as const;

export default {
  VNPAY_RESPONSE_CODES,
  VNPAY_MESSAGES,
  getVNPayMessage,
  isVNPaySuccess,
  isVNPayFailure,
  isUserAction,
  isSystemError,
  isInsufficientFunds,
  isAccountIssue,
  VNPAY_BANK_CODES,
  VNPAY_CARD_TYPES,
};
