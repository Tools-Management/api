const dotenv = require('dotenv');

dotenv.config();

const resolveLogging = () => {
    if (!process.env.DB_LOGGING) {
        return process.env.NODE_ENV === 'development' ? console.log : false;
    }

    const normalized = process.env.DB_LOGGING.toLowerCase();
    return ['true', '1', 'yes'].includes(normalized) ? console.log : false;
};

const baseConfig = {
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
    },
};

const connectionUrl = process.env.DATABASE_URL;

const withConnection = (overrides = {}) => ({
    ...baseConfig,
    logging: resolveLogging(),
    ...overrides,
    ...(connectionUrl
        ? { use_env_variable: 'DATABASE_URL' }
        : {}),
});

module.exports = {
    development: withConnection({
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nova_sites_db',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    }),
    test: withConnection({
        username: 'root',
        password: '',
        database: 'database_test',
        host: '127.0.0.1',
        logging: false,
    }),
    production: withConnection({
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST || 'mysql',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    }),
};
