import { MESSAGES } from '@/constants';
import { LicenseKey, User } from '@/models';
import {
  ApiResponse,
  ILicenseKey,
  ILicenseKeyQuery,
  IPurchaseLicenseRequest,
  IPurchaseLicenseResponse,
} from '@/types';
import { IGenerateLicenseKeysRequest } from '@/types/api.type';
import { AuthApiService } from './auth.api.service';

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
      const generatedKeys = await AuthApiService.generateLicenseKeys(token, data);

      if (!Array.isArray(generatedKeys) || generatedKeys.length === 0) {
        return {
          success: false,
          message: 'No keys generated from external API',
        };
      }

      const savedKeys: string[] = [];

      // Lưu từng key vào database
      for (const keyString of generatedKeys) {
        try {
          // Check xem key đã tồn tại chưa (dùng index key)
          const existingKey = await LicenseKey.findOne({
            where: { key: keyString },
            attributes: ['id'],
          });

          if (!existingKey) {
            // Tạo mới key trong database
            await LicenseKey.create({
              externalId: keyString, // Dùng key string làm externalId
              key: keyString,
              isActive: true,
              duration: data.duration,
              isUsed: false,
            });
            savedKeys.push(keyString);
          }
        } catch (error) {
          console.error(`Failed to save key ${keyString}:`, error);
        }
      }

      return {
        success: true,
        message: 'License keys generated and saved successfully',
        data: {
          generated: savedKeys.length,
          keys: savedKeys,
        },
      };
    } catch (error) {
      console.error('Generate and save license keys error:', error);
      return {
        success: false,
        message: 'Failed to generate and save license keys',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Xóa license key
   * Xóa trong DB trước, sau đó gọi External API để xóa
   */
  static async deleteLicenseKey(token: string, id: number): Promise<ApiResponse<void>> {
    try {
      // 1. Tìm key trong DB để lấy externalId
      const licenseKey = await LicenseKey.findByPk(id);

      if (!licenseKey) {
        return {
          success: false,
          message: 'License key not found in database',
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
          console.error('Failed to delete from external API:', error);
          // Không throw error vì đã xóa trong DB rồi
        }
      }

      return {
        success: true,
        message: 'License key deleted successfully',
      };
    } catch (error) {
      console.error('Delete license key error:', error);
      return {
        success: false,
        message: 'Failed to delete license key',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Đồng bộ license keys từ External API
   * Lấy tất cả keys và lưu vào database
   * Nếu key đã tồn tại (từ generate) thì update externalId cho đúng
   */
  static async syncLicenseKeys(token: string): Promise<ApiResponse<{ synced: number; skipped: number; updated: number }>> {
    try {
      // Lấy tất cả license keys từ External API
      const response = await AuthApiService.getLicenseKeys(token);

      if (!response.success || !response.data) {
        return {
          success: false,
          message: 'Failed to fetch license keys from external API',
          error: response.error || 'Unknown error',
        };
      }

      let syncedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      // Lặp qua tất cả keys và lưu vào database
      for (const externalKey of response.data) {
        try {
          // 1. Check xem key string đã tồn tại chưa (dùng index key)
          const existingKeyByString = await LicenseKey.findOne({
            where: { key: externalKey.key },
            attributes: ['id', 'externalId', 'key'],
          });

          if (existingKeyByString) {
            // Nếu tồn tại key và externalId = key (nghĩa là được tạo từ generate)
            // → Update externalId thành _id thật từ MongoDB
            if (existingKeyByString.externalId === existingKeyByString.key) {
              await existingKeyByString.update({
                externalId: externalKey._id, // Update thành _id thật
              });
              updatedCount++;
            } else {
              // Đã có _id thật rồi, skip
              skippedCount++;
            }
          } else {
            // 2. Nếu chưa tồn tại key, tạo mới
            await LicenseKey.create({
              externalId: externalKey._id,
              key: externalKey.key,
              isActive: externalKey.isActive,
              duration: externalKey.duration,
              isUsed: false,
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
        message: 'License keys synced successfully',
        data: {
          synced: syncedCount,
          skipped: skippedCount,
          updated: updatedCount,
        },
      };
    } catch (error) {
      console.error('Sync license keys error:', error);
      return {
        success: false,
        message: 'Failed to sync license keys',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mua license key
   * Tìm key chưa dùng theo duration và đánh dấu là đã sử dụng
   */
  static async purchaseLicenseKey(
    userId: number,
    data: IPurchaseLicenseRequest
  ): Promise<IPurchaseLicenseResponse> {
    try {
      const { duration } = data;

      // Tìm key chưa sử dụng với duration tương ứng
      const availableKey = await LicenseKey.findOne({
        where: {
          duration: duration,
          isUsed: false,
          isActive: true,
        },
        order: [['createdAt', 'ASC']], // Lấy key cũ nhất trước
      });

      if (!availableKey) {
        return {
          success: false,
          message: `No available license key for duration: ${duration}`,
        };
      }

      // Đánh dấu key là đã sử dụng
      const purchasedAt = new Date();
      await availableKey.update({
        isUsed: true,
        purchasedBy: userId,
        purchasedAt: purchasedAt,
      });

      return {
        success: true,
        message: 'License key purchased successfully',
        data: {
          key: availableKey.key,
          duration: availableKey.duration,
          purchasedAt: purchasedAt,
        },
      };
    } catch (error) {
      console.error('Purchase license key error:', error);
      return {
        success: false,
        message: 'Failed to purchase license key',
      };
    }
  }

  /**
   * Lấy danh sách license keys (chỉ dành cho admin)
   * Có filter theo duration, isUsed, isActive
   */
  static async getAllLicenseKeys({ query }: { query: ILicenseKeyQuery }): Promise<ApiResponse<ILicenseKey[]>> {
    try {
      const { page, limit, duration, isUsed, isActive } = query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (duration) {
        where.duration = duration;
      }

      if (isUsed !== undefined) {
        // Convert string to boolean if needed
        where.isUsed = typeof isUsed === 'string' ? isUsed === 'true' : isUsed;
      }

      if (isActive !== undefined) {
        // Convert string to boolean if needed
        where.isActive = typeof isActive === 'string' ? isActive === 'true' : isActive;
      }

      const licenseKeys = await LicenseKey.findAll({
        where,
        offset: (pageNum - 1) * limitNum,
        limit: limitNum,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'purchaser',
            attributes: ['id', 'username', 'email'],
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
      console.error('Get all license keys error:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Lấy danh sách license keys đã mua của user
   */
  static async getMyLicenseKeys(userId: number): Promise<ApiResponse<ILicenseKey[]>> {
    try {
      const licenseKeys = await LicenseKey.findAll({
        where: {
          purchasedBy: userId,
          isUsed: true,
        },
        order: [['purchasedAt', 'DESC']],
      });

      return {
        success: true,
        message: MESSAGES.SUCCESS.FETCHED,
        data: licenseKeys.map((key) => key.toJSON()),
      };
    } catch (error) {
      console.error('Get my license keys error:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      byDuration: { duration: string; total: number; used: number; available: number }[];
    }>
  > {
    try {
      const total = await LicenseKey.count();
      const used = await LicenseKey.count({ where: { isUsed: true } });
      const available = await LicenseKey.count({ where: { isUsed: false, isActive: true } });

      // Lấy thống kê theo duration
      const durations = await LicenseKey.findAll({
        attributes: ['duration'],
        group: ['duration'],
      });

      const byDuration = await Promise.all(
        durations.map(async (item) => {
          const duration = item.duration;
          const total = await LicenseKey.count({ where: { duration } });
          const used = await LicenseKey.count({ where: { duration, isUsed: true } });
          const available = await LicenseKey.count({
            where: { duration, isUsed: false, isActive: true },
          });

          return {
            duration,
            total,
            used,
            available,
          };
        })
      );

      return {
        success: true,
        message: MESSAGES.SUCCESS.FETCHED,
        data: {
          total,
          used,
          available,
          byDuration,
        },
      };
    } catch (error) {
      console.error('Get license key stats error:', error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

