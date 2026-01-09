import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares";
import { ensureValidToken } from "./api.controller";
import { sendErrorResponse, sendSuccessResponse } from "@/utils";
import { HTTP_STATUS, MESSAGES } from "@/constants";
import { LicenseService } from "@/services/license.service";
import { ILicenseQuery } from "@/types";

/**
 * Đồng bộ licenses từ External API
 * Chỉ admin mới được phép gọi
 */
export const syncLicenses = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // Lấy token API từ user
      const token = await ensureValidToken();

      if (!token) {
        return sendErrorResponse(res, "API token is required");
      }

      const result = await LicenseService.syncLicenses(token);

      if (!result.success) {
        return sendErrorResponse(
          res,
          result.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          result.error
        );
      }

      sendSuccessResponse(res, result.data, result.message);
    } catch (error) {
      if (error instanceof Error) {
        sendErrorResponse(res, error.message);
      } else {
        sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
    }
  }
);

/**
 * Lấy tất cả licenses (Admin only)
 * Có filter
 */
export const getAllLicenses = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query as ILicenseQuery;
      const result = await LicenseService.getAllLicenses({ query });

      if (!result.success) {
        return sendErrorResponse(
          res,
          result.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          result.error
        );
      }
      sendSuccessResponse(res, result, MESSAGES.SUCCESS.FETCHED);
    } catch (error) {
      if (error instanceof Error) {
        sendErrorResponse(res, error.message);
      } else {
        sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
    }
  }
);

/**
 * Update licenses (Admin only)
 */
export const updateLicense = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email, machineId, licenseKey, isActive, expiresAt } = req.body;

      if (!id) {
        return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_ID);
      }

      if (!email) {
        return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_EMAIL);
      }

      if (!machineId) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.LICENSE.REQUIRED_MACHINE_ID
        );
      }

      if (!licenseKey) {
        return sendErrorResponse(
          res,
          MESSAGES.ERROR.LICENSE.REQUIRED_LICENSE_KEY
        );
      }

      const token = await ensureValidToken();

      const result = await LicenseService.updateLicense(id, token, {
        email,
        machineId,
        licenseKey,
        isActive,
        expiresAt,
      });

      if (!result) {
        return sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
      sendSuccessResponse(res, result, MESSAGES.SUCCESS.UPDATED);
    } catch (error) {
      if (error instanceof Error) {
        sendErrorResponse(res, error.message);
      } else {
        sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
    }
  }
);
