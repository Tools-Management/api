import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

import { ROUTES } from "@/constants";
import linkRoutes from "./link.routes";
import ticketRoutes from "./ticket.routes";
import apiRoutes from "./api.routes";
import licenseKeyRoutes from "./license-key.routes";
import walletRoutes from "./wallet.routes";
import web2mRoutes from "./web2m.routes";

const router = Router();

// Health check route
router.get(ROUTES.HEALTH, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use(ROUTES.AUTH, authRoutes);
router.use(ROUTES.USERS, userRoutes);
router.use(ROUTES.LINKS, linkRoutes);
router.use(ROUTES.TICKETS, ticketRoutes);
router.use(ROUTES.API, apiRoutes);
router.use(ROUTES.LICENSE_KEYS, licenseKeyRoutes);
router.use(ROUTES.WALLET, walletRoutes);
router.use(ROUTES.WEB2M, web2mRoutes);

export default router;
