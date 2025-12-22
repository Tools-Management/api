import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/error";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/utils/responseFormatter";
import { MESSAGES, ROUTES, WEB2M_ROUTES } from "@/constants";
import {
  IWeb2MCreateTopupRequest,
  IWeb2MQrCodeRequest,
} from "@/types/web2m.type";
import { Web2MService } from "@/services/web2m.service";
import { generateTopupCode } from "@/utils/web2m.utils";
import { AuthenticatedRequest } from "@/types";

export const getQrCodeURL = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount } = req.query as unknown as IWeb2MQrCodeRequest;

      const memo = generateTopupCode();

      if (!amount) {
        return sendErrorResponse(
          res,
          "At least one of 'amount' must be provided"
        );
      }

      const qrUrl = `${ROUTES.WEB2M}${
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
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.REQUIRED_AUTH);
    }

    const { amount } = req.query as unknown as IWeb2MQrCodeRequest;

    if (Number(amount) <= 0 || isNaN(Number(amount))) {
      return sendErrorResponse(res, "'amount' must be a positive number");
    }

    const memo = generateTopupCode();

    const data = { amount, memo };

    await Web2MService.createTopupRequest(userId, data);

    const buffer = await Web2MService.getQrCodeImage(Number(amount), memo);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  }
);

export const createTopupRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return sendErrorResponse(res, MESSAGES.ERROR.AUTH.REQUIRED_AUTH);
      }

      const { amount } = req.body as IWeb2MCreateTopupRequest;

      const memo = generateTopupCode();

      const data = { amount, memo };

      const result = await Web2MService.createTopupRequest(userId, data);

      if (!result) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.WEB2M.TOPUP_CREATION_FAILED
        );
      }
      sendSuccessResponse(res, null, MESSAGES.SUCCESS.CREATED);
    } catch (error) {
      if (error instanceof Error) {
        sendErrorResponse(res, error.message);
      } else {
        sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
    }
  }
);
