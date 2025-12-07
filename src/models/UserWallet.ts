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

export class UserWallet extends Model<
  InferAttributes<UserWallet>,
  InferCreationAttributes<UserWallet>
> {
  // Primary Key
  declare id: CreationOptional<number>;

  // Foreign Keys
  declare userId: ForeignKey<User['id']>;

  // Attributes
  declare balance: number;
  declare currency: CreationOptional<string>;
  declare isActive: CreationOptional<boolean>;
  declare lastTransactionAt: CreationOptional<Date | null>;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;

  declare static associations: {
    user: Association<UserWallet, User>;
  };
}

UserWallet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'VND'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastTransactionAt: {
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
    tableName: 'user_wallets',
    modelName: 'UserWallet',
    timestamps: true,
    underscored: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      {
        name: 'idx_user_wallets_userId',
        unique: true,
        fields: ['userId']
      },
      {
        name: 'idx_user_wallets_isActive',
        fields: ['isActive']
      }
    ]
  }
);

export default UserWallet;

