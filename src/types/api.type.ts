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
  [key: string]: any;
}

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
export interface IApiRegisterSuccessResponse
  extends IApiResponse<IApiRegisterSuccess> {}

// Response khi lỗi
export interface IApiRegisterErrorResponse extends IApiResponse<null> {}

export interface IApiGetMeSuccessResponse
  extends IApiResponse<IApiUser> {}
export interface IApiGetMeErrorResponse extends IApiResponse<null> {}

// License Keys
export interface IApiGetLicenseKeysSuccessResponse
  extends IApiResponse<IExternalLicenseKey[]> {}
export interface IApiGetLicenseKeysErrorResponse extends IApiResponse<null> {}

// Generate API trả về mảng string keys
export interface IApiGenerateLicenseKeysSuccessResponse
  extends IApiResponse<string[]> {}
export interface IApiGenerateLicenseKeysErrorResponse
  extends IApiResponse<null> {}

export interface IApiGetLicenseKeyByIdSuccessResponse
  extends IApiResponse<ILicenseKey> {}
export interface IApiGetLicenseKeyByIdErrorResponse
  extends IApiResponse<null> {}

export interface IApiCreateLicenseKeySuccessResponse
  extends IApiResponse<ILicenseKey> {}
export interface IApiCreateLicenseKeyErrorResponse extends IApiResponse<null> {}

export interface IApiUpdateLicenseKeySuccessResponse
  extends IApiResponse<ILicenseKey> {}
export interface IApiUpdateLicenseKeyErrorResponse extends IApiResponse<null> {}

// License
export interface IApiUpgradeLicenseSuccessResponse
  extends IApiResponse<ILicenseKey[]> {}
export interface IApiUpgradeLicenseErrorResponse extends IApiResponse<null> {}

export interface IApiValidateLicenseSuccessResponse
  extends IApiResponse<ILicenseResponse> {}
export interface IApiValidateLicenseErrorResponse extends IApiResponse<null> {}

export interface IApiActivateLicenseSuccessResponse
  extends IApiResponse<ILicenseResponse> {}
export interface IApiActivateLicenseErrorResponse extends IApiResponse<null> {}
