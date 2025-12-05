import { MESSAGES } from "@/constants";
import { Ticket, User } from "@/models";
import crypto from "crypto";
import { ApiResponse, ITicket, ITicketCreationAttributes, ITicketStatsResponse, ITicketUpdateAttributes, TICKET_STATUS, TicketQuery } from "@/types";

async function generateUniqueTicketId(): Promise<string> {
  let ticketId: string;

  let exists: boolean;

  do {
    ticketId = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 ký tự in hoa
    exists = (await Ticket.findOne({ where: { ticketId } })) !== null;
  } while (exists);

  return ticketId;
}
export class TicketService {
  /**
   * Get all  tickets
   */
  static async getAllTickets({query}: {query: TicketQuery}): Promise<ApiResponse<ITicketStatsResponse>> {

    const { page, limit, ticketId, department, status } = query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (ticketId) {
      where.ticketId = Number(ticketId);
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    const tickets = await Ticket.findAll({
      where,
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    const total = await Ticket.count({ where });

    const totalTicketsByStatusPending = await Ticket.count({ where: { status: TICKET_STATUS.PENDING } });
    const totalTicketsByStatusProcessing = await Ticket.count({ where: { status: TICKET_STATUS.PROCESSING } });
    const totalTicketsByStatusResolved = await Ticket.count({ where: { status: TICKET_STATUS.RESOLVED } });
    const totalTicketsByStatusClosed = await Ticket.count({ where: { status: TICKET_STATUS.CLOSED } });

    const totalTickets = totalTicketsByStatusPending + totalTicketsByStatusProcessing + totalTicketsByStatusResolved + totalTicketsByStatusClosed;

    return {
      success: true,
      message: MESSAGES.SUCCESS.FETCHED,
      data: {
        tickets,
        stats: {
          pending: totalTicketsByStatusPending,
          processing: totalTicketsByStatusProcessing,
          resolved: totalTicketsByStatusResolved,
          closed: totalTicketsByStatusClosed,
        },
        totalTickets,
      },
      pagination: {
        page: page ? page : 1,
        limit: limit ? limit : 10,
        total: total,
        totalPages: Math.ceil(total / (limit ? limit : 10)),
      },
    };
  }

  static async createTicket(data: ITicketCreationAttributes): Promise<ITicket> {
    if (!data.ticketId) {
      data.ticketId = await generateUniqueTicketId();
    }
    return await Ticket.create(data);
  }

  static async getTicketsByUserId(userId: number): Promise<ITicket[]> {
    return await Ticket.findAll({
      where: { createdBy: userId },
    });
  }

  static async updateTicket(id: number, data: ITicketUpdateAttributes): Promise<boolean> {
    await Ticket.update(data, {
      where: { id },
    });
    return true;
  }
}
