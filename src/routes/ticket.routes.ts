import { Router } from 'express';
import { TICKET_ROUTES } from '@/constants';
import { authenticateToken, requireAdmin } from '@/middlewares/auth';
import { generalRateLimiter } from '@/middlewares/rateLimiter';
import { securityHeaders, sqlInjectionProtection, xssProtection, sanitizeRequest } from '@/middlewares/security';
import { requestLogger } from '@/middlewares/logger';
import { asyncHandler } from '@/middlewares/error';
import { createTicket, getAllTickets, getTicketsByUserId, updateTicket } from '@/controllers/ticket.controller';

const router = Router();

// Apply security middlewares to all routes
router.use(securityHeaders);
router.use(sqlInjectionProtection);
router.use(xssProtection);
router.use(sanitizeRequest);
router.use(requestLogger);


// GET /api/v1/tickets - Get all tickets
router.get(
  TICKET_ROUTES.GET_ALL,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(getAllTickets)
);

router.get(
  TICKET_ROUTES.GET_BY_USER_ID,
  generalRateLimiter,
  authenticateToken,
  asyncHandler(getTicketsByUserId)
);

router.post(
  TICKET_ROUTES.CREATE,
  generalRateLimiter,
  authenticateToken,
  asyncHandler(createTicket)
);

router.put(
  TICKET_ROUTES.UPDATE,
  generalRateLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(updateTicket)
);


export default router; 