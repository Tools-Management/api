export const ENV = {
    ALLOWED_ORIGINS: process.env['ALLOWED_ORIGINS'],

    EXTERNAL_API_URL: process.env['EXTERNAL_API_URL'],
    EMAIL_API_URL: process.env['EMAIL_KEY'],
    PASSWORD_API_URL: process.env['PASSWORD_KEY'],


    API_PREFIX: process.env['API_PREFIX'],
    API_VERSION: process.env['API_VERSION'],

    SUPER_ADMIN_USERNAME: process.env['SUPER_ADMIN_USERNAME'],
    SUPER_ADMIN_EMAIL: process.env['SUPER_ADMIN_EMAIL'],
    SUPER_ADMIN_PASSWORD: process.env['SUPER_ADMIN_PASSWORD'],

    DATABASE_URL: process.env['DATABASE_URL'],
    DB_HOST: process.env['DB_HOST'],
    DB_PORT: process.env['DB_PORT'],
    DB_NAME: process.env['DB_NAME'],
    DB_USER: process.env['DB_USER'],
    DB_PASSWORD: process.env['DB_PASSWORD'],
    DB_LOGGING: process.env['DB_LOGGING'],
    DB_ROOT_PASSWORD: process.env['DB_ROOT_PASSWORD'],

    JWT_ACCESS_SECRET: process.env['JWT_ACCESS_SECRET'],
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'],
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'],
    JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'],

    CLOUDINARY_CLOUD_NAME: process.env['CLOUDINARY_CLOUD_NAME'],
    CLOUDINARY_API_KEY: process.env['CLOUDINARY_API_KEY'],
    CLOUDINARY_API_SECRET: process.env['CLOUDINARY_API_SECRET'],

    EMAIL_HOST: process.env['EMAIL_HOST'],
    EMAIL_PORT: process.env['EMAIL_PORT'],
    EMAIL_USER: process.env['EMAIL_USER'],
    EMAIL_PASS: process.env['EMAIL_PASS'],

    FRONTEND_URL: process.env['FRONTEND_URL'],

    IMAGE_OPTIMIZE_ENABLED: process.env['IMAGE_OPTIMIZE_ENABLED'],
    IMAGE_OPTIMIZE_DEFAULT_W: process.env['IMAGE_OPTIMIZE_DEFAULT_W'],
    IMAGE_OPTIMIZE_DEFAULT_H: process.env['IMAGE_OPTIMIZE_DEFAULT_H'],
    IMAGE_OPTIMIZE_MAX_W: process.env['IMAGE_OPTIMIZE_MAX_W'],
    IMAGE_OPTIMIZE_MAX_H: process.env['IMAGE_OPTIMIZE_MAX_H'],

    NODE_ENV: process.env['NODE_ENV'],
    PORT: process.env['PORT'],
    HOST: process.env['HOST'],
    
}