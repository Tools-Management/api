import { MESSAGES, PLUS_COUNT_KEYS, PRICE_CONSTANTS } from "@/constants";
import { WalletService } from "@/services/wallet.service";
import { LicenseKey, User, UserWallet, WalletTopup } from "@/models";
import {
  ApiResponse,
  ILicenseKey,
  ILicenseKeyQuery,
  IPurchaseLicenseRequest,
  IPurchaseLicenseResponse,
  PAYMENT_METHOD,
  TOPUP_STATUS,
} from "@/types";
import { IGenerateLicenseKeysRequest } from "@/types/api.type";
import { AuthApiService } from "./auth.api.service";
import { Op } from "sequelize";
import { ensureValidToken } from "@/controllers/api.controller";

export class LicenseKeyService {
  /**
   * Generate và lưu license keys mới
   * Gọi External API để generate keys, sau đó lưu vào database
   */
  static async generateAndSaveLicenseKeys(
    token: string,
    data: IGenerateLicenseKeysRequest
  ): Promise<ApiResponse<{ generated: number; keys: string[] }>> {
    try {
      // Gọi External API để generate keys
      // Response trực tiếp là mảng string keys: ['KEY1-XXX-V3', 'KEY2-YYY-V3', ...]
      const generatedKeys = await AuthApiService.generateLicenseKeys(
        token,
        data
      );

      if (!Array.isArray(generatedKeys) || generatedKeys.length === 0) {
        return {
          success: false,
          message: "No keys generated from external API",
        };
      }

      await LicenseKeyService.syncLicenseKeys(token);

      return {
        success: true,
        message: "License keys generated and saved successfully",
        data: {
          generated: data.quantity,
          keys: generatedKeys,
        },
      };
    } catch (error) {
      console.error("Generate and save license keys error:", error);
      return {
        success: false,
        message: "Failed to generate and save license keys",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Xóa license key
   * Xóa trong DB trước, sau đó gọi External API để xóa
   */
  static async deleteLicenseKey(
    token: string,
    id: number
  ): Promise<ApiResponse<void>> {
    try {
      // 1. Tìm key trong DB để lấy externalId
      const licenseKey = await LicenseKey.findByPk(id);

      if (!licenseKey) {
        return {
          success: false,
          message: "License key not found in database",
        };
      }

      const externalId = licenseKey.externalId;

      // 2. Xóa trong DB trước
      await licenseKey.destroy();

      // 3. Gọi External API để xóa (nếu externalId là _id thật từ MongoDB)
      // Chỉ gọi nếu externalId khác với key (nghĩa là có _id thật)
      if (externalId !== licenseKey.key) {
        try {
          await AuthApiService.deleteLicenseKey(token, externalId);
        } catch (error) {
          console.error("Failed to delete from external API:", error);
          // Không throw error vì đã xóa trong DB rồi
        }
      }

      return {
        success: true,
        message: "License key deleted successfully",
      };
    } catch (error) {
      console.error("Delete license key error:", error);
      return {
        success: false,
        message: "Failed to delete license key",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Đồng bộ license keys từ External API
   * Lấy tất cả keys và lưu vào database
   * Nếu key đã tồn tại (từ generate) thì update externalId cho đúng
   */
  static async syncLicenseKeys(
    token: string
  ): Promise<
    ApiResponse<{ synced: number; skipped: number; updated: number }>
  > {
    try {
      // 1 Lấy tất cả license keys từ External API
      const response = await AuthApiService.getLicenseKeys(token);

      if (!response.success || !response.data) {
        return {
          success: false,
          message: "Failed to fetch license keys from external API",
          error: response.error || "Unknown error",
        };
      }

      const externalKeys = response.data;

      let syncedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      // 2 Chuẩn bị danh sách key string từ API
      const keyStrings = externalKeys.map((k) => k.key);

      // 3 Query DB 1 lần duy nhất
      const existingKeys = await LicenseKey.findAll({
        where: { key: keyStrings },
        attributes: [
          "id",
          "externalId",
          "key",
          "isActive",
          "isUsed",
          "purchasedBy",
        ],
      });

      // 4 Map key → record DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keyMap = new Map<string, any>();
      for (const key of existingKeys) {
        keyMap.set(key.key, key);
      }

      // 5 Sync từng key (KHÔNG query DB nữa)
      for (const externalKey of externalKeys) {
        try {
          const existingKey = keyMap.get(externalKey.key);

          if (existingKey) {
            const updatePayload: {
              externalId?: string;
              isActive?: boolean;
              isUsed?: boolean;
            } = {};

            // A️⃣ Update externalId nếu là key generate
            if (existingKey.externalId === existingKey.key) {
              updatePayload.externalId = externalKey._id;
            }

            // B️⃣ Sync isActive
            if (existingKey.isActive !== externalKey.isActive) {
              updatePayload.isActive = externalKey.isActive;
            }

            // C️⃣ Sync isUsed
            if (
              externalKey.isActive === false &&
              existingKey.isUsed === false
            ) {
              updatePayload.isUsed = true;
            }

            // Sync update isUsed when buyed
            if (
              existingKey.isUsed === false &&
              existingKey.purchasedBy !== null
            ) {
              updatePayload.isUsed = true;
            }

            if (Object.keys(updatePayload).length > 0) {
              await existingKey.update(updatePayload);
              updatedCount++;
            } else {
              skippedCount++;
            }
          } else {
            // D️⃣ Key chưa tồn tại → create
            await LicenseKey.create({
              externalId: externalKey._id,
              key: externalKey.key,
              isActive: externalKey.isActive,
              duration: externalKey.duration,
              isUsed: !externalKey.isActive,
            });
            syncedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync key ${externalKey._id}:`, error);
          skippedCount++;
        }
      }

      return {
        success: true,
        message: "License keys synced successfully",
        data: {
          synced: syncedCount,
          skipped: skippedCount,
          updated: updatedCount,
        },
      };
    } catch (error) {
      console.error("Sync license keys error:", error);
      return {
        success: false,
        message: "Failed to sync license keys",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Mua license key
   * Kiểm tra số dư ví, trừ tiền và đánh dấu key đã sử dụng
   */
  static async purchaseLicenseKey(
    userId: number,
    data: IPurchaseLicenseRequest
  ): Promise<IPurchaseLicenseResponse> {
    try {
      const { duration } = data;

      // Kiểm tra duration hợp lệ
      if (!PRICE_CONSTANTS[duration as keyof typeof PRICE_CONSTANTS]) {
        return {
          success: false,
          message: `Invalid duration: ${duration}`,
        };
      }

      const price = PRICE_CONSTANTS[duration as keyof typeof PRICE_CONSTANTS];

      // Kiểm tra số dư ví
      const balanceResult = await WalletService.getBalance(userId);
      if (!balanceResult.success || (balanceResult.balance || 0) < price) {
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.INSUFFICIENT_BALANCE,
        };
      }

      // Lấy token API từ user
      const token = await ensureValidToken();

      const result = await LicenseKeyService.generateAndSaveLicenseKeys(token, {
        quantity: 1,
        duration: duration,
      });

      const keyCheck = result?.data?.keys[0];

      if (!keyCheck) {
        return {
          success: false,
          message: MESSAGES.ERROR.LICENSE.NO_AVAILABLE_KEY,
        };
      }

      // Tìm key chưa sử dụng với key tương ứng
      const availableKey = await LicenseKey.findOne({
        where: {
          key: keyCheck,
          isUsed: false,
        },
      });

      if (!availableKey) {
        return {
          success: false,
          message: `No available license key for duration: ${duration}`,
        };
      }

      // Trừ tiền từ ví
      const wallet = await UserWallet.findOne({ where: { userId } });

      if (!wallet) {
        return {
          success: false,
          message: MESSAGES.ERROR.PAYMENT.WALLET_NOT_FOUND,
        };
      }

      const newBalance = Number(wallet.balance) - price;

      await wallet.update({
        balance: newBalance,
        lastTransactionAt: new Date(),
      });

      const topupCode = `KEY-${keyCheck}-${price}`;

      const requestData = {
        userId,
        walletId: wallet.id,
        topupCode,
        amount: price,
        status: TOPUP_STATUS.COMPLETED,
        paymentMethod: PAYMENT_METHOD.PAYMENT,
        notes: "Mua license key",
      };

      await WalletTopup.create(requestData);

      // Đánh dấu key là đã sử dụng
      const purchasedAt = new Date();
      await availableKey.update({
        isUsed: true,
        purchasedBy: userId,
        purchasedAt: purchasedAt,
      });

      return {
        success: true,
        message: "License key purchased successfully",
        data: {
          key: availableKey.key,
          duration: availableKey.duration,
          price: price,
          purchasedAt: purchasedAt,
        },
      };
    } catch (error) {
      console.error("Purchase license key error:", error);
      return {
        success: false,
        message: "Failed to purchase license key",
      };
    }
  }

  /**
   * Lấy danh sách license keys (chỉ dành cho admin)
   * Có filter theo duration, isUsed, isActive
   */
  static async getAllLicenseKeys({
    query,
  }: {
    query: ILicenseKeyQuery;
  }): Promise<ApiResponse<ILicenseKey[]>> {
    try {
      const { page, limit, duration, isUsed, isActive, key } = query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (duration) {
        where.duration = duration;
      }

      if (isUsed !== undefined) {
        // Convert string to boolean if needed
        where.isUsed = typeof isUsed === "string" ? isUsed === "true" : isUsed;
      }

      if (isActive !== undefined) {
        // Convert string to boolean if needed
        where.isActive =
          typeof isActive === "string" ? isActive === "true" : isActive;
      }

      // SEARCH THEO LICENSE KEY
      if (key) {
        where.key = {
          [Op.like]: `%${key}%`,
        };
      }

      const licenseKeys = await LicenseKey.findAll({
        where,
        offset: (pageNum - 1) * limitNum,
        limit: limitNum,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "purchaser",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      const total = await LicenseKey.count({ where });

      return {
        success: true,
        message: MESSAGES.SUCCESS.FETCHED,
        data: licenseKeys.map((key) => key.toJSON()),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      console.error("Get all license keys error:", error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Lấy danh sách license keys đã mua của user
   */
  static async getMyLicenseKeys(
    userId: number
  ): Promise<ApiResponse<ILicenseKey[]>> {
    try {
      const licenseKeys = await LicenseKey.findAll({
        where: {
          purchasedBy: userId,
          isUsed: true,
        },
        order: [["purchasedAt", "DESC"]],
      });

      return {
        success: true,
        message: MESSAGES.SUCCESS.FETCHED,
        data: licenseKeys.map((key) => key.toJSON()),
      };
    } catch (error) {
      console.error("Get my license keys error:", error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Lấy thống kê license keys
   */
  static async getLicenseKeyStats(): Promise<
    ApiResponse<{
      total: number;
      used: number;
      available: number;
      byDuration: {
        duration: string;
        total: number;
        used: number;
        available: number;
      }[];
    }>
  > {
    try {
      const total = await LicenseKey.count();
      const used = await LicenseKey.count({ where: { isUsed: true } });
      const available = await LicenseKey.count({
        where: { isUsed: false, isActive: true },
      });

      // Lấy thống kê theo duration
      const durations = await LicenseKey.findAll({
        attributes: ["duration"],
        group: ["duration"],
      });

      const byDuration = await Promise.all(
        durations.map(async (item) => {
          const duration = item.duration;
          const total = await LicenseKey.count({ where: { duration } });
          const used = await LicenseKey.count({
            where: { duration, isUsed: true },
          });
          const available = await LicenseKey.count({
            where: { duration, isUsed: false, isActive: true },
          });

          return {
            duration: duration,
            total: Number(total + (PLUS_COUNT_KEYS * 2)),
            used: Number(used + PLUS_COUNT_KEYS),
            available: Number(available + PLUS_COUNT_KEYS),
          };
        })
      );

      return {
        success: true,
        message: MESSAGES.SUCCESS.FETCHED,
        data: {
          total: Number(total + (PLUS_COUNT_KEYS * 2)),
          used: Number(used + PLUS_COUNT_KEYS),
          available: Number(available + PLUS_COUNT_KEYS),
          byDuration,
        },
      };
    } catch (error) {
      console.error("Get license key stats error:", error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
