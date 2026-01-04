/**
 * Wallet Controller
 * Handle HTTP requests for wallet operations
 */

import { Response } from "express";
import { asyncHandler } from "@/middlewares/error";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/utils/responseFormatter";
import { MESSAGES, HTTP_STATUS } from "@/constants";
import { WalletService } from "@/services/wallet.service";
import { WalletTopup } from "@/models/WalletTopup";
import {
  AuthenticatedRequest,
  ICreateTopupRequest,
  ITopupQuery,
  IRequestWithIP,
} from "@/types";
import { validateTopupAmount } from "@/utils/vnpay.utils";
import { getVNPayMessage } from "@/constants/vnpay";
import { ENV, Logger } from "@/lib";

/**
 * GET /api/v1/wallet
 * Lấy thông tin ví của user hiện tại
 */
export const getWallet = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.AUTH.REQUIRED_AUTH,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const result = await WalletService.getOrCreateWallet(userId);

      if (!result.success) {
        return sendErrorResponse(
          res,
          result.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      sendSuccessResponse(res, result.data, result.message);
    } catch (error) {
      Logger.error(`Error in getWallet: ${error}`);
      sendErrorResponse(
        res,
        MESSAGES.ERROR.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
);

/**
 * GET /api/v1/wallet/balance
 * Lấy số dư ví
 */
export const getBalance = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.AUTH.REQUIRED_AUTH,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const result = await WalletService.getBalance(userId);

      if (!result.success) {
        return sendErrorResponse(res, result.message, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccessResponse(
        res,
        {
          balance: result.balance,
          currency: result.currency,
        },
        result.message
      );
    } catch (error) {
      Logger.error(`Error in getBalance: ${error}`);
      sendErrorResponse(
        res,
        MESSAGES.ERROR.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
);

/**
 * POST /api/v1/wallet/topup
 * Tạo yêu cầu nạp tiền và redirect đến VNPay
 */
export const createTopup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.AUTH.REQUIRED_AUTH,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const data = req.body as ICreateTopupRequest;

      // Validate amount
      const amountValidation = validateTopupAmount(data.amount);
      if (!amountValidation.isValid) {
        return sendErrorResponse(
          res,
          amountValidation.error!,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Create topup and get payment URL
      const result = await WalletService.createTopupRequest(
        userId,
        data,
        req as IRequestWithIP
      );

      if (!result.success) {
        return sendErrorResponse(
          res,
          result.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      sendSuccessResponse(
        res,
        {
          paymentUrl: result.paymentUrl,
          topupCode: result.topupCode,
          amount: data.amount,
        },
        "Topup request created. Redirecting to payment gateway..."
      );
    } catch (error) {
      Logger.error(`Error in createTopup: ${error}`);
      sendErrorResponse(
        res,
        MESSAGES.ERROR.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
);

/**
 * GET /api/v1/wallet/vnpay/return
 * VNPay return URL - User được redirect về sau khi thanh toán
 */
export const vnpayReturn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Convert ParsedQs to Record<string, string | string[]>
      const queryData: Record<string, string | string[]> = {};
      Object.keys(req.query).forEach((key) => {
        const value = req.query[key];
        if (typeof value === "string") {
          queryData[key] = value;
        } else if (Array.isArray(value)) {
          queryData[key] = value.map((v) => String(v));
        }
      });

      const callbackResult = await WalletService.processVNPayCallback(
        queryData
      );

      if (!callbackResult.success) {
        // Redirect to frontend with error
        const frontendUrl = ENV.FRONTEND_URL;
        return res.redirect(
          `${frontendUrl}/wallet/topup-failed?reason=invalid_signature`
        );
      }

      // Extract info from query
      const topupCode = String(req.query["vnp_TxnRef"] || "");
      const amount = Number(req.query["vnp_Amount"]) / 100 || 0;
      const transactionNo = String(req.query["vnp_TransactionNo"] || "");
      const responseCode = String(req.query["vnp_ResponseCode"] || "");

      if (responseCode === "00") {
        // Success - redirect to success page
        const frontendUrl = ENV.FRONTEND_URL;
        return res.redirect(
          `${frontendUrl}/wallet/topup-success?` +
            `topupCode=${topupCode}&` +
            `amount=${amount}&` +
            `transactionNo=${transactionNo}`
        );
      } else {
        // Failed - redirect to failure page with error code
        const frontendUrl = ENV.FRONTEND_URL;
        const errorMessage = getVNPayMessage(responseCode);
        return res.redirect(
          `${frontendUrl}/wallet/topup-failed?` +
            `topupCode=${topupCode}&` +
            `code=${responseCode}&` +
            `message=${encodeURIComponent(errorMessage)}`
        );
      }
    } catch (error) {
      console.error("Error in vnpayReturn:", error);
      const frontendUrl = ENV.FRONTEND_URL;
      return res.redirect(
        `${frontendUrl}/wallet/topup-failed?reason=system_error`
      );
    }
  }
);

/**
 * GET /api/v1/wallet/vnpay/ipn
 * VNPay IPN (Instant Payment Notification)
 * Critical: Must return proper response codes to VNPay
 */
export const vnpayIPN = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Convert ParsedQs to Record<string, string | string[]>
      const queryData: Record<string, string | string[]> = {};
      Object.keys(req.query).forEach((key) => {
        const value = req.query[key];
        if (typeof value === "string") {
          queryData[key] = value;
        } else if (Array.isArray(value)) {
          queryData[key] = value.map((v) => String(v));
        }
      });

      const result = await WalletService.processVNPayCallback(queryData);

      // IMPORTANT: VNPay expects JSON response with RspCode and Message
      res.status(HTTP_STATUS.OK).json({
        RspCode: result.rspCode,
        Message: result.message,
      });
    } catch (error) {
      console.error("Error in vnpayIPN:", error);
      // Return error to VNPay
      res.status(HTTP_STATUS.OK).json({
        RspCode: "99",
        Message: "System error",
      });
    }
  }
);

/**
 * GET /api/v1/wallet/topups
 * Lấy lịch sử nạp tiền
 */
export const getTopupHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.AUTH.REQUIRED_AUTH,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const query = req.query as unknown as ITopupQuery;
      const result = await WalletService.getTopupHistory(userId, query);

      if (!result.success) {
        return sendErrorResponse(
          res,
          result.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      sendSuccessResponse(
        res,
        {
          topups: result.data,
          pagination: result.pagination,
        },
        result.message
      );
    } catch (error) {
      Logger.error(`Error in getTopupHistory: ${error}`);
      sendErrorResponse(
        res,
        MESSAGES.ERROR.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
);

/**
 * GET /api/v1/wallet/admin/topups
 * Lấy lịch sử giao dịch only admin
 */
export const getAllTopupHistoryByAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const query = req.query as unknown as ITopupQuery;
      const result = await WalletService.getAllTopupHistoryByAdmin(query);

      if (!result.success) {
        return sendErrorResponse(
          res,
          result.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      sendSuccessResponse(
        res,
        {
          topups: result.data,
          pagination: result.pagination,
        },
        result.message
      );
    } catch (error) {
      Logger.error(`Error in getTopupHistory: ${error}`);
      sendErrorResponse(
        res,
        MESSAGES.ERROR.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
);

/**
 * GET /api/v1/wallet/topups/:topupCode
 * Lấy chi tiết một giao dịch nạp tiền
 */
export const getTopupDetail = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.AUTH.REQUIRED_AUTH,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const { topupCode } = req.params;

      const topup = await WalletTopup.findOne({
        where: { topupCode, userId },
      });

      if (!topup) {
        return sendErrorResponse(res, "Topup not found", HTTP_STATUS.NOT_FOUND);
      }

      sendSuccessResponse(
        res,
        topup.toJSON(),
        "Topup detail retrieved successfully"
      );
    } catch (error) {
      Logger.error(`Error in getTopupDetail: ${error}`);
      sendErrorResponse(
        res,
        MESSAGES.ERROR.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
);
