import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/error';
import { sendErrorResponse, sendSuccessResponse } from '@/utils/responseFormatter';
import { MESSAGES } from '@/constants';
import { ILinksCreationAttributes, ILinksUpdateAttributes } from '@/types';
import { LinkService } from '@/services/link.service';

export const getAllLinks = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    const links = await LinkService.getAllLinks();
    sendSuccessResponse(res, links, MESSAGES.SUCCESS.FETCHED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

export const createLink = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as ILinksCreationAttributes;
    const link = await LinkService.createLink(data);
    sendSuccessResponse(res, link, MESSAGES.SUCCESS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

export const updateLink = asyncHandler(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      return sendErrorResponse(res, MESSAGES.ERROR.LINK.REQUIRED_ID);
    }
    const data = req.body as ILinksUpdateAttributes;
    const link = await LinkService.updateLink(Number(id), data);
    sendSuccessResponse(res, link, MESSAGES.SUCCESS.UPDATED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});