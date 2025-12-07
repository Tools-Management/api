/**
 * Payment Gateway Factory
 * Centralized gateway management
 */

import { IPaymentGateway } from '@/types/payment-gateway';
import { VNPayGateway } from './vnpay.gateway';

export enum PaymentGatewayType {
  VNPAY = 'vnpay',
  // Future gateways
  // MOMO = 'momo',
  // ZALOPAY = 'zalopay',
}

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 */
export class PaymentGatewayFactory {
  private static instances: Map<PaymentGatewayType, IPaymentGateway> = new Map();

  /**
   * Get payment gateway instance
   */
  static getGateway(type: PaymentGatewayType): IPaymentGateway {
    // Return cached instance if exists
    if (this.instances.has(type)) {
      return this.instances.get(type)!;
    }

    // Create new instance
    let gateway: IPaymentGateway;

    switch (type) {
      case PaymentGatewayType.VNPAY:
        gateway = new VNPayGateway();
        break;
      
      // Add more gateways here
      // case PaymentGatewayType.MOMO:
      //   gateway = new MoMoGateway();
      //   break;

      default:
        throw new Error(`Unsupported payment gateway: ${type}`);
    }

    // Cache instance
    this.instances.set(type, gateway);
    
    return gateway;
  }

  /**
   * Get default gateway (VNPay)
   */
  static getDefaultGateway(): IPaymentGateway {
    return this.getGateway(PaymentGatewayType.VNPAY);
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}

// Export gateways
export { VNPayGateway } from './vnpay.gateway';
export type { IPaymentGateway } from '@/types/payment-gateway';

