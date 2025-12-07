/**
 * VNPay Configuration
 * Read-only constants và environment-based configs
 */

import { ENV } from '@/lib/env';

// VNPay API Version (readonly)
export const VNPAY_CONFIG = {
  VERSION: '2.1.0',
  COMMAND: {
    PAY: 'pay',
    QUERY_DR: 'querydr',
    REFUND: 'refund',
  },
  CURRENCY_CODE: 'VND',
  LOCALE: {
    VN: 'vn',
    EN: 'en',
  },
  ORDER_TYPE: {
    TOPUP: 'topup',
    BILLPAYMENT: 'billpayment',
    OTHER: 'other',
  },
  HASH_ALGORITHM: 'sha512',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  
  // Amount multiplier (VNPay requires amount in xu - 1 VND = 100 xu)
  AMOUNT_MULTIPLIER: 100,
  
  // Transaction timeout (minutes)
  TRANSACTION_TIMEOUT: 15,
  
  // Minimum and maximum topup amount
  MIN_TOPUP_AMOUNT: 10000, // 10,000 VND
  MAX_TOPUP_AMOUNT: 100000000, // 100,000,000 VND
} as const;

// VNPay URLs and Secrets (from environment)
export const getVNPayConfig = () => {
  const tmnCode = ENV.VNPAY_TMN_CODE;
  const hashSecret = ENV.VNPAY_HASH_SECRET;
  const paymentUrl = ENV.VNPAY_URL;
  const apiUrl = ENV.VNPAY_API_URL;
  const returnUrl = ENV.VNPAY_RETURN_URL;
  const ipnUrl = ENV.VNPAY_IPN_URL;

  // Validate required configs
  if (!tmnCode || !hashSecret || !paymentUrl || !returnUrl || !ipnUrl) {
    throw new Error('VNPay configuration is incomplete. Please check environment variables.');
  }

  return {
    tmnCode,
    hashSecret,
    paymentUrl,
    apiUrl,
    returnUrl,
    ipnUrl,
  };
};

// Validate VNPay config on startup
export const validateVNPayConfig = (): boolean => {
  try {
    const config = getVNPayConfig();
    
    // Check if URLs are valid
    if (!config.paymentUrl.startsWith('http')) {
      throw new Error('Invalid VNPay payment URL');
    }
    
    if (!config.returnUrl.startsWith('http')) {
      throw new Error('Invalid VNPay return URL');
    }
    
    if (!config.ipnUrl.startsWith('http')) {
      throw new Error('Invalid VNPay IPN URL');
    }
    
    // Check hash secret length
    if (config.hashSecret.length < 32) {
      throw new Error('VNPay hash secret too short');
    }
    
    return true;
  } catch (error) {
    console.error('VNPay configuration validation failed:', error);
    return false;
  }
};

export default {
  VNPAY_CONFIG,
  getVNPayConfig,
  validateVNPayConfig,
};

