import { Router } from "express";

import { getQrCodeURL, getQrCodeImage } from "@/controllers/web2m.controller";
import { WEB2M_ROUTES } from "@/constants";

const router = Router();

router.get(WEB2M_ROUTES.GET_QRCODE, getQrCodeURL);
router.get(WEB2M_ROUTES.QR_PAY, getQrCodeImage);

export default router;
