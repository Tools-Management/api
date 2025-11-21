import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/error';
import { sendErrorResponse, sendSuccessResponse } from '@/utils/responseFormatter';
import { MESSAGES } from '@/constants';
import { TicketService } from '@/services/ticket.service';
import { AuthenticatedRequest, ITicketCreationAttributes, ITicketUpdateAttributes, TicketQuery } from '@/types';

export const getAllTickets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as TicketQuery;
    const tickets = await TicketService.getAllTickets({ query });
    sendSuccessResponse(res, tickets, MESSAGES.SUCCESS.FETCHED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as ITicketCreationAttributes;
    const ticket = await TicketService.createTicket(data);
    sendSuccessResponse(res, ticket, MESSAGES.SUCCESS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

export const getTicketsByUserId = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.REQUIRED_AUTH);
    }
    const tickets = await TicketService.getTicketsByUserId(userId);
    sendSuccessResponse(res, tickets, MESSAGES.SUCCESS.FETCHED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});

export const updateTicket = asyncHandler(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      return sendErrorResponse(res, MESSAGES.ERROR.TICKET.REQUIRED_ID);
    }
    const data = req.body as ITicketUpdateAttributes;
    const ticket = await TicketService.updateTicket(Number(id), data);
    sendSuccessResponse(res, ticket, MESSAGES.SUCCESS.UPDATED);
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(res, error.message);
    } else {
      sendErrorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }
});