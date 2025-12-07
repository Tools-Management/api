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
import { TOPUP_STATUS } from '@/types';

// export type TopupStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export class WalletTopup extends Model<
  InferAttributes<WalletTopup>,
  InferCreationAttributes<WalletTopup>
> {
  // Primary Key
  declare id: CreationOptional<number>;

  // Foreign Keys
  declare userId: ForeignKey<User['id']>;
  declare walletId: ForeignKey<UserWallet['id']>;

  // Attributes
  declare topupCode: string;
  declare amount: number;
  declare transactionCode: CreationOptional<string | null>;
  declare status: CreationOptional<TOPUP_STATUS>;
  declare paymentMethod: CreationOptional<string>;
  declare paymentDetails: CreationOptional<Record<string, string | number | boolean> | null>;
  declare ipAddress: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  
  // VNPay specific fields
  declare vnpResponseCode: CreationOptional<string | null>;
  declare vnpTransactionNo: CreationOptional<string | null>;
  declare vnpBankCode: CreationOptional<string | null>;
  declare vnpBankTranNo: CreationOptional<string | null>;
  declare vnpCardType: CreationOptional<string | null>;
  declare vnpPayDate: CreationOptional<string | null>;
  declare vnpOrderInfo: CreationOptional<string | null>;
  declare vnpSecureHash: CreationOptional<string | null>;
  
  declare completedAt: CreationOptional<Date | null>;
  declare failedAt: CreationOptional<Date | null>;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare wallet?: NonAttribute<UserWallet>;

  declare static associations: {
    user: Association<WalletTopup, User>;
    wallet: Association<WalletTopup, UserWallet>;
  };
}

WalletTopup.init(
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
    walletId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_wallets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    topupCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 1000 // Minimum 1,000 VND
      }
    },
    transactionCode: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TOPUP_STATUS)),
      allowNull: false,
      defaultValue: "pending"
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'vnpay'
    },
    paymentDetails: {
      type: DataTypes.JSON,
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
    vnpResponseCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Mã phản hồi từ VNPay (00 = success)'
    },
    vnpTransactionNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Mã giao dịch VNPay'
    },
    vnpBankCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Mã ngân hàng thanh toán'
    },
    vnpBankTranNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Mã giao dịch tại ngân hàng'
    },
    vnpCardType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Loại thẻ thanh toán (ATM/QRCODE)'
    },
    vnpPayDate: {
      type: DataTypes.STRING(14),
      allowNull: true,
      comment: 'Thời gian thanh toán VNPay (yyyyMMddHHmmss)'
    },
    vnpOrderInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Thông tin đơn hàng từ VNPay'
    },
    vnpSecureHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Chữ ký hash từ VNPay để verify'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failedAt: {
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
    tableName: 'wallet_topups',
    modelName: 'WalletTopup',
    timestamps: true,
    underscored: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      {
        name: 'idx_wallet_topups_userId',
        fields: ['userId']
      },
      {
        name: 'idx_wallet_topups_walletId',
        fields: ['walletId']
      },
      {
        name: 'idx_wallet_topups_topupCode',
        unique: true,
        fields: ['topupCode']
      },
      {
        name: 'idx_wallet_topups_transactionCode',
        fields: ['transactionCode']
      },
      {
        name: 'idx_wallet_topups_status',
        fields: ['status']
      },
      {
        name: 'idx_wallet_topups_createdAt',
        fields: ['createdAt']
      },
      {
        name: 'idx_wallet_topups_vnpResponseCode',
        fields: ['vnpResponseCode']
      },
      {
        name: 'idx_wallet_topups_vnpTransactionNo',
        fields: ['vnpTransactionNo']
      },
      {
        name: 'idx_wallet_topups_vnpBankTranNo',
        fields: ['vnpBankTranNo']
      }
    ]
  }
);

export default WalletTopup;

