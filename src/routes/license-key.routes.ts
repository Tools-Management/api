import { Router } from 'express';
import { LICENSE_KEY_ROUTES } from '@/constants';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '@/middlewares/auth';
import { generalRateLimiter } from '@/middlewares/rateLimiter';
import { securityHeaders, sqlInjectionProtection, xssProtection, sanitizeRequest } from '@/middlewares/security';
import { requestLogger } from '@/middlewares/logger';
import { asyncHandler } from '@/middlewares/error';
import {
  syncLicenseKeys,
  purchaseLicenseKey,
  getAllLicenseKeys,
  getMyLicenseKeys,
  getLicenseKeyStats,
  deleteLicenseKey,
} from '@/controllers/license-key.controller';

const router = Router();

// Apply security middlewares to all routes
router.use(securityHeaders);
router.use(sqlInjectionProtection);
router.use(xssProtection);
router.use(sanitizeRequest);
router.use(requestLogger);

/**
 * POST /api/v1/license-keys/sync
 * Đồng bộ license keys từ External API
 * Chỉ admin mới được phép gọi
 */
router.post(
  LICENSE_KEY_ROUTES.SYNC,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(syncLicenseKeys)
);

/**
 * POST /api/v1/license-keys/purchase
 * Mua license key
 * User đã thanh toán thành công sẽ gọi endpoint này
 * Body: { duration: "30d" }
 */
router.post(
  LICENSE_KEY_ROUTES.PURCHASE,
  generalRateLimiter,
  authenticateToken,
  asyncHandler(purchaseLicenseKey)
);

/**
 * GET /api/v1/license-keys
 * Lấy tất cả license keys (Admin only)
 * Query params: page, limit, duration, isUsed, isActive
 */
router.get(
  LICENSE_KEY_ROUTES.GET_ALL,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(getAllLicenseKeys)
);

/**
 * GET /api/v1/license-keys/my-keys
 * Lấy license keys đã mua của user hiện tại
 */
router.get(
  LICENSE_KEY_ROUTES.GET_MY_KEYS,
  generalRateLimiter,
  authenticateToken,
  asyncHandler(getMyLicenseKeys)
);

/**
 * GET /api/v1/license-keys/stats
 * Lấy thống kê license keys (Admin only)
 */
router.get(
  LICENSE_KEY_ROUTES.GET_STATS,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(getLicenseKeyStats)
);

/**
 * DELETE /api/v1/license-keys/:id
 * Xóa license key (Admin only)
 */
router.delete(
  '/:id',
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(deleteLicenseKey)
);

export default router;

