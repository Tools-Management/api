/**
 * Wallet Service
 * Handle wallet operations, topups, và balance management
 */

import { Transaction } from 'sequelize';
import sequelize from '@/config/database';
import { UserWallet, WalletTopup } from '@/models';
import {
  IUserWallet,
  ICreateTopupRequest,
  IUpdateTopupRequest,
  IWalletResponse,
  ITopupQuery,
  IRequestWithIP
} from '@/types';
// Define TOPUP_STATUS enum locally
enum TOPUP_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}
import { PaymentStatus } from '@/types/payment-gateway';
import { generateTopupCode, getClientIp } from '@/utils/vnpay.utils';
import { PaymentGatewayFactory } from '@/gateways';
import { VNPAY_RESPONSE_CODES } from '@/constants/vnpay';
import { MESSAGES } from '@/constants';

export class WalletService {
  private static paymentGateway = PaymentGatewayFactory.getDefaultGateway();
  /**
   * Lấy hoặc tạo wallet cho user
   * Auto-create wallet nếu chưa có
   */
  static async getOrCreateWallet(userId: number): Promise<IWalletResponse> {
    try {
      let wallet = await UserWallet.findOne({ where: { userId } });
      
      if (!wallet) {
        wallet = await UserWallet.create({
          userId,
          balance: 0,
          currency: 'VND',
          isActive: true,
        });
        
        console.log(`Created new wallet for user ${userId}`);
      }

      return {
        success: true,
        message: MESSAGES.SUCCESS.WALLET.WALLET_RETRIEVED_SUCCESS,
        data: wallet.toJSON() as IUserWallet,
      };
    } catch (error) {
      console.error('Error getting/creating wallet:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error,
      };
    }
  }

  /**
   * Lấy thông tin wallet
   */
  static async getWallet(userId: number): Promise<IWalletResponse> {
    try {
      const wallet = await UserWallet.findOne({ where: { userId } });
      
      if (!wallet) {
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.WALLET_NOT_FOUND,
        };
      }

      return {
        success: true,
        message: MESSAGES.SUCCESS.WALLET.WALLET_RETRIEVED_SUCCESS,
        data: wallet.toJSON() as IUserWallet,
      };
    } catch (error) {
      console.error('Error getting wallet:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error,
      };
    }
  }

  /**
   * Tạo yêu cầu nạp tiền và generate VNPay payment URL
   */
  static async createTopupRequest(
    userId: number,
    data: ICreateTopupRequest,
    req: IRequestWithIP
  ): Promise<{ success: boolean; message: string; paymentUrl?: string; topupCode?: string; error?: unknown }> {
    try {
      // Get or create wallet
      const walletResult = await this.getOrCreateWallet(userId);
      if (!walletResult.success || !walletResult.data) {
        return {
          success: false,
          message: MESSAGES.ERROR.INTERNAL_ERROR,
        };
      }
      
      const wallet = walletResult.data;
      const topupCode = generateTopupCode();
      const ipAddress = getClientIp(req);

      console.log("wallet", wallet)
      console.log("topupCode", topupCode)
      console.log("ipAddress", ipAddress)
      
      // Create topup record with status=pending
      await WalletTopup.create({
        userId,
        walletId: wallet.id,
        topupCode,
        amount: data.amount,
        status: TOPUP_STATUS.PENDING,
        paymentMethod: data.paymentMethod || 'vnpay',
        ipAddress,
        notes: data.notes,
      });
      
      // Generate VNPay payment URL using gateway
      const paymentUrl = await this.paymentGateway.createPaymentUrl(
        topupCode,
        data.amount,
        `Nap tien vao vi - ${topupCode}`,
        {
          ipAddress,
          locale: 'vn',
        }
      );

      console.log("paymentUrl", paymentUrl)
      
      console.log(`Topup request created: ${topupCode}, Amount: ${data.amount}`);

      return {
        success: true,
        message: MESSAGES.SUCCESS.WALLET.TOPUP_REQUEST_CREATED_SUCCESS,
        paymentUrl,
        topupCode,
      };
    } catch (error) {
      console.error('Error creating topup request:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error,
      };
    }
  }

  /**
   * Process VNPay IPN callback (Idempotent)
   * Critical: Must be transaction-safe and idempotent
   */
  static async processVNPayCallback(
    callbackData: Record<string, string | string[]>
  ): Promise<{ success: boolean; message: string; rspCode: string; error?: unknown }> {
    const transaction: Transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    
    try {
      // Verify callback using payment gateway
      const verifyResult = await this.paymentGateway.verifyCallback(
        callbackData as Record<string, unknown>
      );
      
      if (!verifyResult.isValid) {
        await transaction.rollback();
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.INVALID_SIGNATURE,
          rspCode: VNPAY_RESPONSE_CODES.INVALID_SIGNATURE,
        };
      }
      
      // Find topup by code
      const topup = await WalletTopup.findOne({
        where: { topupCode: verifyResult.merchantOrderRef },
        lock: transaction.LOCK.UPDATE, // Row-level lock
        transaction,
      });
      
      if (!topup) {
        await transaction.rollback();
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.ORDER_NOT_FOUND,
          rspCode: VNPAY_RESPONSE_CODES.TRANSACTION_NOT_FOUND,
        };
      }
      
      // Idempotency check - if already processed, return success
      if (topup.status === 'completed' || topup.status === 'failed') {
        await transaction.commit();
        console.log(`Topup ${verifyResult.merchantOrderRef} already processed. Status: ${topup.status}`);
        return {
          success: true,
          message: MESSAGES.SUCCESS.WALLET.TRANSACTION_ALREADY_PROCESSED,
          rspCode: VNPAY_RESPONSE_CODES.TRANSACTION_ALREADY_CONFIRMED,
        };
      }
      
      // Extract amount from gateway response
      const callbackAmount = Number(callbackData['vnp_Amount']) / 100; // Convert from xu to VND
      
      // Validate amount
      if (callbackAmount !== topup.amount) {
        await transaction.rollback();
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.AMOUNT_MISMATCH,
          rspCode: VNPAY_RESPONSE_CODES.INVALID_AMOUNT,
        };
      }
      
      // Update topup with VNPay response
      const updateData: IUpdateTopupRequest = {
        vnpResponseCode: String(callbackData['vnp_ResponseCode'] || ''),
        vnpTransactionNo: String(callbackData['vnp_TransactionNo'] || ''),
        vnpBankCode: String(callbackData['vnp_BankCode'] || ''),
        vnpBankTranNo: String(callbackData['vnp_BankTranNo'] || ''),
        vnpCardType: String(callbackData['vnp_CardType'] || ''),
        vnpPayDate: String(callbackData['vnp_PayDate'] || ''),
        vnpOrderInfo: String(callbackData['vnp_OrderInfo'] || ''),
        transactionCode: verifyResult.gatewayTransactionNo,
        paymentDetails: callbackData as Record<string, string | number | boolean>,
      };
      
      if (verifyResult.status === PaymentStatus.COMPLETED) {
        // Success - complete topup and add balance
        updateData.status = TOPUP_STATUS.COMPLETED;
        updateData.completedAt = new Date();
        
        await topup.update(updateData, { transaction });
        
        // Add balance to wallet (with row lock)
        const wallet = await UserWallet.findOne({
          where: { id: topup.walletId },
          lock: transaction.LOCK.UPDATE,
          transaction,
        });
        
        if (!wallet) {
          await transaction.rollback();
          return {
            success: false,
            message: MESSAGES.ERROR.PAYMENT.WALLET_NOT_FOUND,
            rspCode: VNPAY_RESPONSE_CODES.UNKNOWN_ERROR,
          };
        }
        
        await wallet.update({
          balance: Number(wallet.balance) + topup.amount,
          lastTransactionAt: new Date(),
        }, { transaction });
        
        await transaction.commit();
        
        console.log(`Topup completed: ${topup.topupCode}, Added ${topup.amount} VND to wallet ${wallet.id}`);

        return {
          success: true,
          message: MESSAGES.SUCCESS.WALLET.TOPUP_COMPLETED_SUCCESS,
          rspCode: VNPAY_RESPONSE_CODES.SUCCESS,
        };
      } else {
        // Failed transaction
        updateData.status = TOPUP_STATUS.FAILED;
        updateData.failedAt = new Date();
        
        await topup.update(updateData, { transaction });
        await transaction.commit();
        
        console.log(`Topup failed: ${topup.topupCode}, Code: ${updateData.vnpResponseCode}`);
        
        return {
          success: true,
          message: MESSAGES.SUCCESS.WALLET.TRANSACTION_MARKED_AS_FAILED,
          rspCode: VNPAY_RESPONSE_CODES.SUCCESS, // IPN always returns 00 to VNPay
        };
      }
    } catch (error) {
      await transaction.rollback();
      console.error('Error processing VNPay callback:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        rspCode: VNPAY_RESPONSE_CODES.UNKNOWN_ERROR,
        error,
      };
    }
  }

  /**
   * Lấy lịch sử nạp tiền
   */
  static async getTopupHistory(
    userId: number,
    query: ITopupQuery = {}
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data?: unknown[]; 
    pagination?: { page: number; limit: number; total: number; totalPages: number };
    error?: unknown;
  }> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const where: { 
        userId: number; 
        status?: string; 
        paymentMethod?: string;
      } = { userId };
      
      if (query.status) {
        where.status = query.status;
      }
      
      if (query.paymentMethod) {
        where.paymentMethod = query.paymentMethod;
      }
      
      const { count, rows } = await WalletTopup.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      return {
        success: true,
        message: MESSAGES.SUCCESS.WALLET.TOPUP_HISTORY_RETRIEVED_SUCCESS,
        data: rows.map(r => r.toJSON()),
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error('Error getting topup history:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error,
      };
    }
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId: number): Promise<{ success: boolean; balance?: number; currency?: string; message: string }> {
    try {
      const wallet = await UserWallet.findOne({ where: { userId } });
      
      if (!wallet) {
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.WALLET_NOT_FOUND,
        };
      }

      return {
        success: true,
        balance: Number(wallet.balance),
        currency: wallet.currency,
        message: MESSAGES.SUCCESS.WALLET.WALLET_BALANCE_RETRIEVED_SUCCESS,
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
      };
    }
  }
}

export default WalletService;

