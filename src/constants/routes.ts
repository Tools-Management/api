// Route Constants
export const ROUTES = {
  // Main Resources
  AUTH: '/auth',
  USERS: '/users',
  UPLOAD: '/upload',
  LINKS: '/links',
  TICKETS: '/tickets',
  API: '/api-management',
  // Health Check
  HEALTH: '/health',
} as const;


// Auth Route Paths
export const AUTH_ROUTES = {
  BASE: '/',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  RESEND_OTP: '/resend-otp',
  LOGIN: '/login',
  LOGOUT: '/logout',
  REFRESH_TOKEN: '/refresh-token',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

// User Route Paths
export const USER_ROUTES = {
  BASE: '/',
  GET_ALL: '/',
  GET_BY_ID: '/:id',
  GET_PROFILE: '/profile',
  UPDATE_PROFILE: '/profile',
  UPDATE_AVATAR: '/profile/avatar',
  CHANGE_PASSWORD: '/change-password',
  DELETE: '/:id',
  SOFT_DELETE: '/:id/soft-delete',
} as const;

export const TICKET_ROUTES = {
  BASE: '/',
  GET_ALL: '/',
  GET_BY_ID: '/:id',
  GET_BY_USER_ID: '/my-tickets',
  CREATE: '/',
  UPDATE: '/:id',
  DELETE: '/:id',
} as const;

export const LINK_ROUTES = {
  BASE: '/',
  GET_ALL: '/',
  GET_BY_ID: '/:id',
  CREATE: '/',
  UPDATE: '/:id',
  DELETE: '/:id',
} as const;

export const API_ROUTES = {
  LICENSE_KEYS: {
    BASE: '/license-keys',
    GET_ALL: '/license-keys',
    GET_BY_ID: '/license-keys/:id',
    CREATE: '/license-keys',
    UPDATE: '/license-keys/:id',
    DELETE: '/license-keys/:id',
    GENERATE: '/license-keys/generate/batch',
  },
  LICENSES: {
    BASE: '/licenses',
    ACTIVATE: '/licenses/activate',
    VALIDATE: '/licenses/validate',
    UPGRADE: '/licenses/upgrade',
  },
} as const;

// Full API Paths (for documentation and testing)
export const API_PATHS = {
  // Auth
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    VERIFY_OTP: '/api/v1/auth/verify-otp',
    RESEND_OTP: '/api/v1/auth/resend-otp',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },
  
  // Users
  USERS: {
    GET_ALL: '/api/v1/users',
    GET_BY_ID: '/api/v1/users/:id',
    GET_PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    UPDATE_AVATAR: '/api/v1/users/profile/avatar',
    CHANGE_PASSWORD: '/api/v1/users/change-password',
    DELETE: '/api/v1/users/:id',
    SOFT_DELETE: '/api/v1/users/:id/soft-delete',
  },
  
  // Health Check
  HEALTH: '/api/v1/health',
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// Route Metadata for Documentation
export const ROUTE_METADATA = {
  HEALTH: {
    GET: {
      method: HTTP_METHODS.GET,
      path: ROUTES.HEALTH,
      description: 'Health check endpoint',
      tags: ['System'],
    },
  },
} as const; 