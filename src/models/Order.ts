import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  Association,
  NonAttribute
} from 'sequelize';
import sequelize from '@/config/database';
import { User } from './User';
import { UserWallet } from './UserWallet';
import { ORDER_STATUS, ORDER_TYPE, PAYMENT_STATUS } from '@/types';

// export type OrderType = 'license_key' | 'product' | 'service' | 'other';
// export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';
// export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  // Primary Key
  declare id: CreationOptional<number>;

  // Foreign Keys
  declare userId: ForeignKey<User['id']>;
  declare walletId: CreationOptional<ForeignKey<UserWallet['id']> | null>;

  // Attributes
  declare orderCode: string;
  declare orderType: CreationOptional<ORDER_TYPE>;
  declare itemId: CreationOptional<number | null>;
  declare itemType: CreationOptional<string | null>;
  declare itemDetails: CreationOptional<Record<string, string | number | boolean> | null>;
  declare originalPrice: number;
  declare discountAmount: CreationOptional<number>;
  declare totalAmount: number;
  declare status: CreationOptional<ORDER_STATUS>;
  declare paymentMethod: CreationOptional<string>;
  declare paymentStatus: CreationOptional<PAYMENT_STATUS>;
  declare paymentDetails: CreationOptional<Record<string, string | number | boolean> | null>;
  declare transactionCode: CreationOptional<string | null>;
  declare ipAddress: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  declare cancellationReason: CreationOptional<string | null>;
  declare completedAt: CreationOptional<Date | null>;
  declare cancelledAt: CreationOptional<Date | null>;
  declare paidAt: CreationOptional<Date | null>;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare wallet?: NonAttribute<UserWallet>;

  declare static associations: {
    user: Association<Order, User>;
    wallet: Association<Order, UserWallet>;
  };
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    orderCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    orderType: {
      type: DataTypes.ENUM(...Object.values(ORDER_TYPE)),
      allowNull: false,
      defaultValue: ORDER_TYPE.LICENSE_KEY
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    itemType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    itemDetails: {
      type: DataTypes.JSON,
      allowNull: true
    },
    originalPrice: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discountAmount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    totalAmount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
      allowNull: false,
      defaultValue: "pending"
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'wallet'
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      allowNull: false,
      defaultValue: "unpaid"
    },
    paymentDetails: {
      type: DataTypes.JSON,
      allowNull: true
    },
    walletId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user_wallets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    transactionCode: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'orders',
    modelName: 'Order',
    timestamps: true,
    underscored: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      {
        name: 'idx_orders_userId',
        fields: ['userId']
      },
      {
        name: 'idx_orders_orderCode',
        unique: true,
        fields: ['orderCode']
      },
      {
        name: 'idx_orders_status',
        fields: ['status']
      },
      {
        name: 'idx_orders_paymentStatus',
        fields: ['paymentStatus']
      },
      {
        name: 'idx_orders_orderType',
        fields: ['orderType']
      },
      {
        name: 'idx_orders_walletId',
        fields: ['walletId']
      },
      {
        name: 'idx_orders_createdAt',
        fields: ['createdAt']
      },
      {
        name: 'idx_orders_item',
        fields: ['itemId', 'itemType']
      }
    ]
  }
);

export default Order;

