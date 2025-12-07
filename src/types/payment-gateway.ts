/**
 * Payment Gateway Interface
 * Định nghĩa contract cho tất cả payment gateways
 */

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface PaymentVerificationResult {
  isValid: boolean;
  status: PaymentStatus;
  merchantOrderRef: string;
  gatewayTransactionNo?: string;
  message: string;
  gatewayResponseData: Record<string, unknown>;
}

export interface GatewayRefundOptions {
  amount: number;
  reason?: string;
  performedBy?: string;
  ipAddress?: string;
}

export interface PaymentRefundResult {
  isSuccess: boolean;
  transactionId?: string;
  gatewayResponseData: Record<string, unknown>;
  message?: string;
}

/**
 * Base interface for all payment gateways
 */
export interface IPaymentGateway {
  /**
   * Get gateway name
   */
  getName(): string;

  /**
   * Create payment URL for redirect
   */
  createPaymentUrl(
    orderRef: string,
    amount: number,
    orderInfo: string,
    additionalData?: Record<string, string | number>
  ): Promise<string>;

  /**
   * Verify payment callback from gateway
   */
  verifyCallback(
    data: Record<string, unknown>
  ): Promise<PaymentVerificationResult>;

  /**
   * Refund a payment
   */
  refundPayment?(
    orderRef: string,
    gatewayTransactionNo: string,
    options: GatewayRefundOptions
  ): Promise<PaymentRefundResult>;
}

