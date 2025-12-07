// Wallet and Order Types

// Define enums locally for wallet types
export enum TOPUP_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum ORDER_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum PAYMENT_STATUS {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum ORDER_TYPE {
  LICENSE_KEY = 'license_key',
  PRODUCT = 'product',
  SERVICE = 'service',
  OTHER = 'other',
}

// Request interface for IP extraction
export interface IRequestWithIP {
  ip?: string;
  headers: { 'x-forwarded-for'?: string };
  connection?: { remoteAddress?: string; socket?: { remoteAddress?: string } };
  socket?: { remoteAddress?: string };
}

// VNPay Response Interface
export interface IVNPayResponse {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_PayDate: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
  [key: string]: string | number | boolean;
}

// UserWallet Interfaces
export interface IUserWallet {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  isActive: boolean;
  lastTransactionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateWalletRequest {
  userId: number;
  balance?: number;
  currency?: string;
}

export interface IUpdateWalletRequest {
  balance?: number;
  isActive?: boolean;
  lastTransactionAt?: Date;
}

// WalletTopup Interfaces
export interface IWalletTopup {
  id: number;
  userId: number;
  walletId: number;
  topupCode: string;
  amount: number;
  transactionCode: string | null;
  status: TOPUP_STATUS;
  paymentMethod: string;
  paymentDetails: Record<string, string | number | boolean> | null;
  ipAddress: string | null;
  notes: string | null;
  
  // VNPay specific fields
  vnpResponseCode: string | null;
  vnpTransactionNo: string | null;
  vnpBankCode: string | null;
  vnpBankTranNo: string | null;
  vnpCardType: string | null;
  vnpPayDate: string | null;
  vnpOrderInfo: string | null;
  vnpSecureHash: string | null;
  
  completedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTopupRequest {
  userId: number;
  amount: number;
  paymentMethod?: string;
  ipAddress?: string;
  notes?: string;
}

export interface IUpdateTopupRequest {
  status?: TOPUP_STATUS;
  transactionCode?: string;
  paymentDetails?: Record<string, string | number | boolean>;
  vnpResponseCode?: string;
  vnpTransactionNo?: string;
  vnpBankCode?: string;
  vnpBankTranNo?: string;
  vnpCardType?: string;
  vnpPayDate?: string;
  vnpOrderInfo?: string;
  vnpSecureHash?: string;
  completedAt?: Date;
  failedAt?: Date;
}

// VNPay Response Interface
export interface IVNPayResponse {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_PayDate: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string; // topupCode
  vnp_SecureHashType: string;
  vnp_SecureHash: string;
}

// VNPay IPN (Instant Payment Notification) Request
export interface IVNPayIPNRequest {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_PayDate: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHashType: string;
  vnp_SecureHash: string;
}

export interface ITopupQuery {
  userId?: number;
  status?: TOPUP_STATUS;
  paymentMethod?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// Order Interfaces
export interface IOrder {
  id: number;
  userId: number;
  orderCode: string;
  orderType: ORDER_TYPE;
  itemId: number | null;
  itemType: string | null;
  itemDetails: Record<string, string | number | boolean> | null;
  originalPrice: number;
  discountAmount: number;
  totalAmount: number;
  status: ORDER_STATUS;
  paymentMethod: string;
  paymentStatus: PAYMENT_STATUS;
  paymentDetails: Record<string, string | number | boolean> | null;
  walletId: number | null;
  transactionCode: string | null;
  ipAddress: string | null;
  notes: string | null;
  cancellationReason: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrderRequest {
  userId: number;
  orderType: ORDER_TYPE;
  itemId?: number;
  itemType?: string;
  itemDetails?: Record<string, string | number | boolean>;
  originalPrice: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  walletId?: number;
  ipAddress?: string;
  notes?: string;
}

export interface IUpdateOrderRequest {
  status?: ORDER_STATUS;
  paymentStatus?: PAYMENT_STATUS;
  paymentDetails?: Record<string, string | number | boolean>;
  transactionCode?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  paidAt?: Date;
  cancellationReason?: string;
}

export interface IOrderQuery {
  userId?: number;
  status?: ORDER_STATUS;
  paymentStatus?: PAYMENT_STATUS;
  orderType?: ORDER_TYPE;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// Stats Interfaces
export interface IWalletStats {
  totalBalance: number;
  totalTopups: number;
  totalTopupAmount: number;
  pendingTopups: number;
  completedTopups: number;
}

export interface IOrderStats {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

// Response Interfaces
export interface ITopupResponse {
  success: boolean;
  message: string;
  data?: IWalletTopup;
  error?: unknown;
}

export interface IOrderResponse {
  success: boolean;
  message: string;
  data?: IOrder;
  error?: unknown;
}

export interface IWalletResponse {
  success: boolean;
  message: string;
  data?: IUserWallet;
  error?: unknown;
}

