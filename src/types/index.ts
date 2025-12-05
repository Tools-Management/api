import { SAME_SITE_OPTIONS } from '@/constants';
import { Request } from 'express';
import { Options } from 'sequelize';

export interface DatabaseConfig {
  development: Options;
  test: Options;
  production: Options;
}

// Database Models

export interface ITicketStats {
  pending: number;
  processing: number;
  resolved: number;
  closed: number;
}

export interface ITicketStatsResponse {
  stats: ITicketStats;
  tickets: ITicket[];
  totalTickets: number;
}

export interface ITicket {
  id: number;
  ticketId: string;
  department: string;
  order?: number;
  phone?: string;
  title: string;
  content: string;
  status: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  replies?: string | null;
}

export interface ITicketUpdateAttributes {
  ticketId: string;
  status?: string;
  replies: string;
}

export interface ITicketCreationAttributes {
  ticketId: string;
  department: string;
  order?: number;
  phone?: string;
  title: string;
  content: string;
  status: string;
  createdBy: number;
}

export interface ITicketReplyCreationAttributes {
  ticketId: number;
  content: string;
  status: string;
}

export interface TicketQuery {
  page?: number;
  limit?: number;
  ticketId?: string;
  department?: string;
  status?: string;
}


export interface ILinks {
  id: number;
  type: LINK_TYPES;
  link: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum LINK_TYPES {
  DOWNLOAD = 'download',
  INTRO_VIDEO = 'intro_video',
}

export enum TICKET_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface ILinksCreationAttributes {
  type: LINK_TYPES;
  link: string;
}

export interface ILinksUpdateAttributes {
  link: string;
}

export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  isActive: boolean;
  otp?: string | null;
  tokenApi?: string | null;
  otpExpiresAt?: Date | null;
  image?: string;
  role: string;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface UserCreationAttributes {
  username: string;
  email: string;
  password: string;
  isActive?: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  image?: string;
  role?: string;
}

// Request Extensions
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
}

// Cookie Request
export interface CookieRequest extends Request {
  cookies: {
    access_token?: string;
    refresh_token?: string;
  };
}

// Request with file
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Log Data
export interface LogData {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody?: any;
  error?: string;
}

// API Response Types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Environment Variables
export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
  ALLOWED_ORIGINS: string;
  API_VERSION: string;
  API_PREFIX: string;
  FRONTEND_URL: string;
} 

// Interface cho uploaded files
export interface UploadedFile extends Express.Multer.File {
  buffer: Buffer;
}

// Interface cho upload options
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformation?: any[];
  quality?: string | number;
  format?: string;
}

// Interface cho upload result
export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

// Interface cho delete result
export interface CloudinaryDeleteResult {
  success: boolean;
  result?: string;
  error?: string;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: typeof SAME_SITE_OPTIONS[keyof typeof SAME_SITE_OPTIONS];
  maxAge: number;
  path: string;
  domain?: string;
}

export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface UserValidationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// License Key Types
export interface ILicenseKey {
  id: number;
  externalId: string; // _id từ external API
  key: string;
  isActive: boolean;
  duration: string;
  isUsed: boolean;
  purchasedBy?: number | null; // userId của người mua
  purchasedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILicenseKeyCreationAttributes {
  externalId: string;
  key: string;
  isActive: boolean;
  duration: string;
  isUsed?: boolean;
  purchasedBy?: number | null;
  purchasedAt?: Date | null;
}

export interface ILicenseKeyUpdateAttributes {
  isUsed?: boolean;
  purchasedBy?: number | null;
  purchasedAt?: Date | null;
  isActive?: boolean;
}

export interface IPurchaseLicenseRequest {
  duration: string; // "7d", "30d", "1d", etc.
}

export interface IPurchaseLicenseResponse {
  success: boolean;
  message: string;
  data?: {
    key: string;
    duration: string;
    purchasedAt: Date;
  };
}

export interface ILicenseKeyQuery {
  page?: number;
  limit?: number;
  duration?: string;
  isUsed?: boolean;
  isActive?: boolean;
}