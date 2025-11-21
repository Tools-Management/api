import { MESSAGES } from "@/constants";
import { Ticket, User } from "@/models";
import { ApiResponse, ITicket, ITicketCreationAttributes, ITicketUpdateAttributes, TicketQuery } from "@/types";

export class TicketService {
  /**
   * Get all  tickets
   */
  static async getAllTickets({query}: {query: TicketQuery}): Promise<ApiResponse<ITicket[]>> {

    const { page, limit, ticketId, department, status } = query;

    const where: any = {};

    if (ticketId) {
      where.ticketId = ticketId;
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    const tickets = await Ticket.findAll({
      where,
      offset: (page ? page - 1 : 0) * (limit ? limit : 10),
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    const total = await Ticket.count({ where });

    return {
      success: true,
      message: MESSAGES.SUCCESS.FETCHED,
      data: tickets,
      pagination: {
        page: page ? page : 1,
        limit: limit ? limit : 10,
        total: total,
        totalPages: Math.ceil(total / (limit ? limit : 10)),
      },
    };
  }

  static async createTicket(data: ITicketCreationAttributes): Promise<ITicket> {
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
