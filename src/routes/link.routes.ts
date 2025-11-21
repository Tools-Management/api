import { Router } from 'express';
import { LINK_ROUTES } from '@/constants';
import { authenticateToken, requireAdmin } from '@/middlewares/auth';
import { generalRateLimiter } from '@/middlewares/rateLimiter';
import { securityHeaders, sqlInjectionProtection, xssProtection, sanitizeRequest } from '@/middlewares/security';
import { requestLogger } from '@/middlewares/logger';
import { asyncHandler } from '@/middlewares/error';
import { createLink, getAllLinks, updateLink } from '@/controllers/link.controller';

const router = Router();

// Apply security middlewares to all routes
router.use(securityHeaders);
router.use(sqlInjectionProtection);
router.use(xssProtection);
router.use(sanitizeRequest);
router.use(requestLogger);


// GET /api/v1/tickets - Get all tickets
router.get(
  LINK_ROUTES.GET_ALL,
  asyncHandler(getAllLinks)
);


router.post(
  LINK_ROUTES.CREATE,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(createLink)
);

router.put(
  LINK_ROUTES.UPDATE,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(updateLink)
);


export default router; 