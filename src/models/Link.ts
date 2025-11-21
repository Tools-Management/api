import { Model, DataTypes } from "sequelize";
import sequelize from "@/config/database";
import { ILinks, ILinksCreationAttributes, LINK_TYPES } from "@/types";

export class Link extends Model<ILinks, ILinksCreationAttributes> {
  public id!: number;
  public type!: LINK_TYPES;
  public link!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Link.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(LINK_TYPES)),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [Object.values(LINK_TYPES)],
      },
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "links",
    modelName: "Link",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Link;
