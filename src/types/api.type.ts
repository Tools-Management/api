// types/api.type.ts

export interface IApiUser {
  id: string;
  email: string;
  role: string;
}

export interface IApiRegisterSuccess {
  token: string;
  expiresIn: string; // hoặc number nếu là giây
  user: IApiUser;
}

export interface IApiErrorDetail {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: IApiErrorDetail;
}

// ===========================
// License Payload
// ===========================
export interface ILicensePayload {
  email: string;
  machineId: string;
  licenseKey: string;
}

// ===========================
// License Response
// ===========================
export interface ILicenseResponse {
  email: string;
  machineId: string;
  licenseKey: string;
  isActive: boolean;
  expiresAt: string; // ISO date-time
  activatedAt: string; // ISO date-time
  lastValidatedAt: string; // ISO date-time
}

// ===========================
// License Object
// ===========================
export interface ILicenseApiResponse {
  _id: string;
  email: string;
  machineId: string;
  licenseKey: string;
  isActive: boolean;
  expiresAt: Date;
  activatedAt: Date | null;
  lastValidatedAt: Date | null;
}

export interface ILicenseApiUpdateRequest {
  email: string;
  machineId: string;
  licenseKey: string;
  isActive: boolean;
  expiresAt: Date;
  activatedAt?: Date | null;
  lastValidatedAt?: Date | null;
}

// ===========================
// Upgrade License Request
// ===========================
export interface IUpgradeLicenseRequest {
  email: string;
  machineId: string;
  newLicenseKey: string;
}

// ===========================
// License Key object
// ===========================
export interface ILicenseKey {
  id: string;
  key: string;
  isActive: boolean;
  duration: string; // e.g. "30d", "1y", "lifetime"
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}

// External API License Key (from MongoDB - có _id thay vì id)
export interface IExternalLicenseKey {
  _id: string;
  key: string;
  isActive: boolean;
  duration: string;
  __v?: number;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// Create License Key Request
// ===========================
export interface ICreateLicenseKeyRequest {
  key: string;
  isActive: boolean;
  duration: string;
}

// ===========================
// Update License Key Request
// ===========================
export interface IUpdateLicenseKeyRequest {
  key: string;
  isActive: boolean;
  duration: string;
}

// ===========================
// Generate License Keys Request
// ===========================
export interface IGenerateLicenseKeysRequest {
  quantity: number; // [1, 1000]
  duration: string;
}

// Response khi thành công
export type IApiRegisterSuccessResponse
  = IApiResponse<IApiRegisterSuccess>

// Response khi lỗi
export type IApiRegisterErrorResponse = IApiResponse<null>

export type IApiGetMeSuccessResponse
  = IApiResponse<IApiUser>
export type IApiGetMeErrorResponse = IApiResponse<null>

// License Keys
export type IApiGetLicenseKeysSuccessResponse
  = IApiResponse<IExternalLicenseKey[]>
export type IApiGetLicenseKeysErrorResponse = IApiResponse<null>

// Generate API trả về mảng string keys
export type IApiGenerateLicenseKeysSuccessResponse
  = IApiResponse<string[]>
export type IApiGenerateLicenseKeysErrorResponse
  = IApiResponse<null>

export type IApiGetLicenseKeyByIdSuccessResponse
  = IApiResponse<ILicenseKey>
export type IApiGetLicenseKeyByIdErrorResponse
  = IApiResponse<null>

export type IApiCreateLicenseKeySuccessResponse
  = IApiResponse<ILicenseKey>
export type IApiCreateLicenseKeyErrorResponse = IApiResponse<null>

export type IApiUpdateLicenseKeySuccessResponse
  = IApiResponse<ILicenseKey>
export type IApiUpdateLicenseKeyErrorResponse = IApiResponse<null>

// License
export type IApiUpgradeLicenseSuccessResponse
  = IApiResponse<ILicenseKey[]>
export type IApiUpgradeLicenseErrorResponse = IApiResponse<null>

export type IApiValidateLicenseSuccessResponse
  = IApiResponse<ILicenseResponse>
export type IApiValidateLicenseErrorResponse = IApiResponse<null>

export type IApiActivateLicenseSuccessResponse
  = IApiResponse<ILicenseResponse>
export type IApiActivateLicenseErrorResponse = IApiResponse<null>

// LICENSES
export type IApiLicensesSuccessResponse
  = IApiResponse<ILicenseApiResponse[]>
export type IApiLicensesErrorResponse = IApiResponse<null>
