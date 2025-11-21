import { Router } from "express";
import { API_ROUTES } from "@/constants";
import { authenticateToken, requireSuperAdmin } from "@/middlewares/auth";
import { generalRateLimiter } from "@/middlewares/rateLimiter";
import {
  securityHeaders,
  sqlInjectionProtection,
  xssProtection,
  sanitizeRequest,
} from "@/middlewares/security";
import { requestLogger } from "@/middlewares/logger";
import { asyncHandler } from "@/middlewares/error";
import {
  activateLicense,
  createLicenseKey,
  deleteLicenseKey,
  generateLicenseKeys,
  getLicenseKeyById,
  getLicenseKeys,
  updateLicenseKey,
  upgradeLicense,
  validateLicense,
} from "@/controllers/api.controller";

const router = Router();

// Apply security middlewares to all routes
router.use(securityHeaders);
router.use(sqlInjectionProtection);
router.use(xssProtection);
router.use(sanitizeRequest);
router.use(requestLogger);

//LICENSE KEYS
router.get(API_ROUTES.LICENSE_KEYS.GET_ALL, asyncHandler(getLicenseKeys));

router.get(
  API_ROUTES.LICENSE_KEYS.GET_BY_ID,
  authenticateToken,
  asyncHandler(getLicenseKeyById)
);

router.post(
  API_ROUTES.LICENSE_KEYS.CREATE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(createLicenseKey)
);

router.post(
  API_ROUTES.LICENSE_KEYS.GENERATE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(generateLicenseKeys)
);

router.put(
  API_ROUTES.LICENSE_KEYS.UPDATE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(updateLicenseKey)
);

router.delete(
  API_ROUTES.LICENSE_KEYS.DELETE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(deleteLicenseKey)
);

//LICENSES
router.post(
  API_ROUTES.LICENSES.UPGRADE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(upgradeLicense)
);

router.post(
  API_ROUTES.LICENSES.VALIDATE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(validateLicense)
);

router.post(
  API_ROUTES.LICENSES.ACTIVATE,
  generalRateLimiter,
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(activateLicense)
);

export default router;
