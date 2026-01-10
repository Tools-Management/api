import {
  Model,
  DataTypes
} from 'sequelize';
import sequelize from '@/config/database';
import { ILicense } from '@/types';

export class License extends Model<ILicense> {
  public id!: number;
  public externalId!: string;
  public email!: string;
  public machineId!: string; // _id of api
  public licenseKey!: string;
  public isActive!: boolean;
  public expiresAt!: Date;
  public activatedAt?: Date | null;
  public lastValidatedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

License.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    externalId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'external_id',
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    machineId: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'machine_id',
      validate: {
        notEmpty: true,
      },
    },
    licenseKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'license_key',
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'activated_at',
    },
    lastValidatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'lastValidated_at',
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
    tableName: 'licenses',
    modelName: 'License',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['external_id'],
      },
      {
        fields: ['machine_id'],
      },
      {
        fields: ['license_key'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default License;

