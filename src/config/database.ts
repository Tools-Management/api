import dotenv from 'dotenv';
import { Options, Sequelize } from 'sequelize';
import { DatabaseConfig } from '@/types';
import { ENV } from '../lib';

dotenv.config();

const env = ENV.NODE_ENV || 'development';

const resolveLogging = (): false | ((sql: string, timing?: number) => void) => {
    if (!ENV.DB_LOGGING) {
        return env === 'development' ? console.log : false;
    }

    const normalized = ENV.DB_LOGGING.toLowerCase();
    return ['true', '1', 'yes'].includes(normalized) ? console.log : false;
};

const baseOptions: Pick<Options, 'dialect' | 'pool' | 'timezone' | 'define'> = {
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    timezone: '+07:00',
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    }
};

const config: DatabaseConfig = {
    development: {
        ...baseOptions,
        username: ENV.DB_USER || 'root',
        password: ENV.DB_PASSWORD || '',
        database: ENV.DB_NAME || 'nova_sites_db',
        host: ENV.DB_HOST || 'localhost',
        port: parseInt(ENV.DB_PORT || '3306', 10),
        logging: resolveLogging(),
    },
    test: {
        ...baseOptions,
        username: 'root',
        password: '',
        database: 'database_test',
        host: '127.0.0.1',
        logging: false,
    },
    production: {
        ...baseOptions,
        username: ENV.DB_USER || '',
        password: ENV.DB_PASSWORD || '',
        database: ENV.DB_NAME || '',
        host: ENV.DB_HOST || 'mysql',
        port: parseInt(ENV.DB_PORT || '3306', 10),
        logging: resolveLogging(),
    }
};

const currentConfig = config[env as keyof DatabaseConfig];

const sequelizeOptions: Options = {
    dialect: currentConfig.dialect ?? 'mysql',
    host: currentConfig.host ?? 'localhost',
    port: currentConfig.port ?? 3306,
    pool: currentConfig.pool?? {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: currentConfig.logging,
    timezone: currentConfig.timezone ?? '+07:00',
    define: currentConfig.define,
};

const useConnectionString = Boolean(ENV.DATABASE_URL);

const sequelize = useConnectionString
    ? new Sequelize(ENV.DATABASE_URL as string, sequelizeOptions)
    : new Sequelize(
        currentConfig.database!,
        currentConfig.username!,
        currentConfig.password!,
        sequelizeOptions
    );

export default sequelize;