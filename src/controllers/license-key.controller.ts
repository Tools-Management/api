import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/error';
import { sendErrorResponse, sendSuccessResponse } from '@/utils/responseFormatter';
import { MESSAGES, HTTP_STATUS } from '@/constants';
import { LicenseKeyService } from '@/services/license-key.service';
import { AuthenticatedRequest, ILicenseKeyQuery, IPurchaseLicenseRequest } from '@/types';
import { ensureValidToken } from './api.controller';

/**
 * Đồng bộ license keys từ External API
 * Chỉ admin mới được phép gọi
 */
export const syncLicenseKeys = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // Lấy token API từ user
      const token = await ensureValidToken();

      if (!token) {
        return sendErrorResponse(res, 'API token is required');
      }

      const result = await LicenseKeyService.syncLicenseKeys(token);

      if (!result.success) {
        return sendErrorResponse(res, result.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
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
 * Mua license key
 * User đã thanh toán thành công sẽ gọi endpoint này
 */
export const purchaseLicenseKey = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(res, MESSAGES.ERROR.AUTH.REQUIRED_AUTH);
      }

      const data = req.body as IPurchaseLicenseRequest;

      if (!data.duration) {
        return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_DURATION);
      }

      const result = await LicenseKeyService.purchaseLicenseKey(userId, data);

      if (!result.success) {
        return sendErrorResponse(res, result.message);
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
 * Lấy tất cả license keys (Admin only)
 * Có filter theo duration, isUsed, isActive
 */
export const getAllLicenseKeys = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as ILicenseKeyQuery;
    const result = await LicenseKeyService.getAllLicenseKeys({ query });

    if (!result.success) {
      return sendErrorResponse(res, result.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
    }
    sendSuccessResponse(res, result, MESSAGES.SUCCESS.FETCHED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

/**
 * Lấy license keys đã mua của user hiện tại
 */
export const getMyLicenseKeys = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendErrorResponse(res, MESSAGES.ERROR.AUTH.REQUIRED_AUTH);
      }

      const result = await LicenseKeyService.getMyLicenseKeys(userId);

      if (!result.success) {
        return sendErrorResponse(res, result.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
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
 * Lấy thống kê license keys (Admin only)
 */
export const getLicenseKeyStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await LicenseKeyService.getLicenseKeyStats();

    if (!result.success) {
      return sendErrorResponse(res, result.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
    }

    sendSuccessResponse(res, result.data, result.message);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

/**
 * Xóa license key
 * Admin only - Xóa trong DB và External API
 */
export const deleteLicenseKey = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);

      if (isNaN(id)) {
        return sendErrorResponse(res, 'Invalid license key ID', HTTP_STATUS.BAD_REQUEST);
      }

      const token = await ensureValidToken();

      if (!token) {
        return sendErrorResponse(res, 'API token is required');
      }
      
      const result = await LicenseKeyService.deleteLicenseKey(token, id);

      if (!result.success) {
        return sendErrorResponse(res, result.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
      }

      sendSuccessResponse(res, null, result.message);
    } catch (error) {
      if (error instanceof Error) {
        sendErrorResponse(res, error.message);
      } else {
        sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
      }
    }
  }
);

