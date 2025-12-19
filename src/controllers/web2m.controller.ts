import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/error";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/utils/responseFormatter";
import { ENV } from "@/lib/env";
import { MESSAGES, ROUTES, WEB2M_ROUTES } from "@/constants";
import { IWeb2MQrCodeRequest } from "@/types/web2m.type";
import { Web2MService } from "@/services/web2m.service";

export const getQrCodeURL = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, memo } = req.query as unknown as IWeb2MQrCodeRequest;

      if (!amount && !memo) {
        return sendErrorResponse(
          res,
          "At least one of 'amount' or 'memo' must be provided"
        );
      }

      const qrUrl = `${ENV.API_PREFIX}/${ENV.API_VERSION}/${ROUTES.WEB2M}/${
        WEB2M_ROUTES.QR_PAY
      }?amount=${amount}&memo=${encodeURIComponent(memo)}`;

      sendSuccessResponse(res, { qr_url: qrUrl }, MESSAGES.SUCCESS.FETCHED);
    } catch (error) {
      if (error instanceof Error) {
        sendErrorResponse(res, error.message);
      } else {
        sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
    }
  }
);

export const getQrCodeImage = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { amount, memo } = req.query as unknown as IWeb2MQrCodeRequest;

    if (Number(amount) <= 0 || isNaN(Number(amount))) {
      return sendErrorResponse(res, "'amount' must be a positive number");
    }

    if (!amount || !memo) {
      return sendErrorResponse(
        res,
        "At least one of 'amount' or 'memo' must be provided"
      );
    }

    const buffer = await Web2MService.getQrCodeImage(Number(amount), memo);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  }
);
