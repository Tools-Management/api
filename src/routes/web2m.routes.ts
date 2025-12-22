import { Router } from "express";

import { getQrCodeURL, getQrCodeImage, createTopupRequest } from "@/controllers/web2m.controller";
import { WEB2M_ROUTES } from "@/constants";
import { authenticateToken } from "@/middlewares";

const router = Router();

router.get(WEB2M_ROUTES.GET_QRCODE, authenticateToken, getQrCodeURL);
router.get(WEB2M_ROUTES.QR_PAY, authenticateToken, getQrCodeImage);
router.post(WEB2M_ROUTES.CREATE_TOPUP, authenticateToken, createTopupRequest);

export default router;
    