export interface IWeb2MConfig {
  baseUrl: string;
  bankName: string;
  bankNumber: string;
  accountHolder: string;
  isMask: string;
  bankBackground: string;
}

export enum TypeTransaction {
  PLUS_MONEY = "IN",
  MINUS_MONEY = "OUT",
}

export enum Web2MErrorCode {
  INVALID_TOKEN = 99,
}

export interface IWeb2MTransaction {
  transactionID: string;
  amount: string;
  description: string;
  transactionDate: string;
  type: TypeTransaction;
}

export interface IWeb2MTransactionApiResponse {
  status?: boolean | number;
  message?: string;
  transactions?: IWeb2MTransaction[];
}

export interface IWeb2MTransactionRequest {
  username: string;
  bankNumber: string;
  token: string;
  password: string;
  fromDate: string;
  toDate: string;
}

export interface IWeb2MTransactionResponse {
  success: boolean;
  message: string;
  data: IWeb2MTransaction[];
}

export interface IWeb2MQrCodeResponse {
  success: boolean;
  message: string;
  data: Buffer;
}

export interface IWeb2MErrorResponse {
  success: boolean;
  message: string;
  error: unknown;
}

export interface IWeb2MQrCodeRequest {
  amount: number;
  memo: string;
}

export interface IWeb2MCreateTopupRequest {
  amount: number;
  memo?: string;
}
