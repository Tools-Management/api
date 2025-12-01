import {
  Model,
  DataTypes,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Association,
} from "sequelize";
import sequelize from "@/config/database";
import { ITicket, ITicketCreationAttributes, TICKET_STATUS } from "@/types";
import { User } from "@/models";

export class Ticket extends Model<ITicket, ITicketCreationAttributes> {
  public id!: number;
  public ticketId!: string;
  public department!: string;
  public order?: number;
  public phone?: string;
  public title!: string;
  public content!: string;
  public status!: string;
  public createdBy!: number;
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association data
  public creator?: User;
  public updater?: User;

  // Association methods
  public getCreator!: BelongsToGetAssociationMixin<User>;
  public setCreator!: BelongsToSetAssociationMixin<User, number>;
  public getUpdater!: BelongsToGetAssociationMixin<User>;
  public setUpdater!: BelongsToSetAssociationMixin<User, number>;

  // Static associations (optional, for type safety)
  public static override associations: {
    creator: Association<Ticket, User>;
    updater: Association<Ticket, User>;
  };
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [2, 255] },
    },
    department: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: { notEmpty: true },
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: { notEmpty: true },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TICKET_STATUS)),
      allowNull: false,
      defaultValue: "pending",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    replies: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: { type: DataTypes.DATE, allowNull: true, field: "created_at", },
    updatedAt: { type: DataTypes.DATE, allowNull: true, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "tickets",
    modelName: "Ticket",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// === ASSOCIATIONS ===
Ticket.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
Ticket.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

export default Ticket;
