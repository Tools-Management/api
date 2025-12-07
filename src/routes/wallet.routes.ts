/**
 * Wallet Routes
 * Handle wallet and topup endpoints
 */

import express from 'express';
import { 
  getWallet, 
  getBalance,
  createTopup,
  vnpayReturn,
  vnpayIPN,
  getTopupHistory,
  getTopupDetail
} from '@/controllers/wallet.controller';
import { authenticateToken } from '@/middlewares/auth';
import { generalRateLimiter } from '@/middlewares/rateLimiter';
import { securityHeaders, sqlInjectionProtection, xssProtection } from '@/middlewares/security';
import { requestLogger } from '@/middlewares/logger';
import { WALLET_ROUTES } from '@/constants/routes';

const router = express.Router();

// Apply common middlewares
router.use(requestLogger);
router.use(securityHeaders);
router.use(sqlInjectionProtection);
router.use(xssProtection);

/**
 * GET /api/v1/wallet
 * Lấy thông tin ví
 * Require: Authentication
 */
router.get(
  WALLET_ROUTES.BASE,
  generalRateLimiter,
  authenticateToken,
  getWallet
);

/**
 * GET /api/v1/wallet/balance
 * Lấy số dư ví
 * Require: Authentication
 */
router.get(
  WALLET_ROUTES.GET_BALANCE,
  generalRateLimiter,
  authenticateToken,
  getBalance
);

/**
 * POST /api/v1/wallet/topup
 * Tạo yêu cầu nạp tiền
 * Require: Authentication
 * Body: { amount: number, paymentMethod?: string, notes?: string }
 */
router.post(
  WALLET_ROUTES.CREATE_TOPUP,
  // strictRateLimiter, // Strict limit to prevent abuse
  authenticateToken,
  createTopup
);

/**
 * GET /api/v1/wallet/topups
 * Lấy lịch sử nạp tiền
 * Require: Authentication
 * Query: page, limit, status, paymentMethod
 */
router.get(
  WALLET_ROUTES.TOPUPS,
  // generalRateLimiter,
  authenticateToken,
  getTopupHistory
);

/**
 * GET /api/v1/wallet/topups/:topupCode
 * Lấy chi tiết giao dịch nạp tiền
 * Require: Authentication
 */
router.get(
  WALLET_ROUTES.TOPUP_DETAIL,
  generalRateLimiter,
  authenticateToken,
  getTopupDetail
);

/**
 * GET /api/v1/wallet/vnpay/return
 * VNPay return URL - User redirect sau khi thanh toán
 * Public endpoint (no auth required)
 */
router.get(
  WALLET_ROUTES.VNPAY_RETURN,
  vnpayReturn
);

/**
 * GET /api/v1/wallet/vnpay/ipn
 * VNPay IPN (Instant Payment Notification)
 * Public endpoint - VNPay server calls this
 * CRITICAL: Must return proper JSON response
 */
router.get(
  WALLET_ROUTES.VNPAY_IPN,
  vnpayIPN
);

export default router;

