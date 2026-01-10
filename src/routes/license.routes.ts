import { Router } from "express";
import { LICENSE_ROUTES } from "@/constants";
import {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
} from "@/middlewares/auth";
import { generalRateLimiter } from "@/middlewares/rateLimiter";
import {
  securityHeaders,
  sqlInjectionProtection,
  xssProtection,
  sanitizeRequest,
} from "@/middlewares/security";
import { requestLogger } from "@/middlewares/logger";
import {
  getAllLicenses,
  syncLicenses,
  updateLicense,
} from "@/controllers/license.controller";

const router = Router();

// Apply security middlewares to all routes
router.use(securityHeaders);
router.use(sqlInjectionProtection);
router.use(xssProtection);
router.use(sanitizeRequest);
router.use(requestLogger);

/**
 * POST /api/v1/licenses/sync
 * Đồng bộ licenses từ External API
 * Chỉ admin mới được phép gọi
 */
router.post(
  LICENSE_ROUTES.SYNC,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  syncLicenses
);

/**
 * PUT /api/v1/licenses/:id
 * Update license
 */
router.put(
  LICENSE_ROUTES.UPDATE,
  generalRateLimiter,
  authenticateToken,
  updateLicense
);

/**
 * GET /api/v1/licenses
 * Lấy tất cả licenses (Admin only)
 * Query params: page, limit, email, machineId, externalId, licenseKey, isActive
 */
router.get(
  LICENSE_ROUTES.GET_ALL,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  getAllLicenses
);

export default router;
