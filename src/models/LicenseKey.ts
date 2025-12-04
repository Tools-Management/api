import {
  Model,
  DataTypes,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Association,
} from 'sequelize';
import sequelize from '@/config/database';
import { ILicenseKey, ILicenseKeyCreationAttributes } from '@/types';
import { User } from '@/models';

export class LicenseKey extends Model<ILicenseKey, ILicenseKeyCreationAttributes> {
  public id!: number;
  public externalId!: string;
  public key!: string;
  public isActive!: boolean;
  public duration!: string;
  public isUsed!: boolean;
  public purchasedBy?: number | null;
  public purchasedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association data
  public purchaser?: User;

  // Association methods
  public getPurchaser!: BelongsToGetAssociationMixin<User>;
  public setPurchaser!: BelongsToSetAssociationMixin<User, number>;

  // Static associations
  public static override associations: {
    purchaser: Association<LicenseKey, User>;
  };
}

LicenseKey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    externalId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'external_id',
      validate: {
        notEmpty: true,
      },
    },
    key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_used',
    },
    purchasedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'purchased_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    purchasedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'purchased_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'license_keys',
    modelName: 'LicenseKey',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['external_id'],
      },
      {
        unique: true,
        fields: ['key'],
      },
      {
        fields: ['duration'],
      },
      {
        fields: ['is_used'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['purchased_by'],
      },
    ],
  }
);

// === ASSOCIATIONS ===
LicenseKey.belongsTo(User, { foreignKey: 'purchased_by', as: 'purchaser' });

export default LicenseKey;

