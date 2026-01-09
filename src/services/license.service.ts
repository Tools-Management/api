import { ApiResponse, ILicense, ILicenseQuery } from "@/types";
import { AuthApiService } from "./auth.api.service";
import { License } from "@/models";
import { ILicenseApiUpdateRequest } from "@/types/api.type";
import { Op, WhereOptions } from "sequelize";
import { MESSAGES } from "@/constants";
import { Logger } from "@/lib";

export class LicenseService {
  /**
   * Đồng bộ licenses từ External API
   * Lấy tất cả licenses và lưu vào database
   * Nếu license đã tồn tại (từ generate) thì update externalId cho đúng
   */
  static async syncLicenses(
    token: string
  ): Promise<
    ApiResponse<{ synced: number; skipped: number; updated: number }>
  > {
    try {
      // 1 Lấy tất cả licenses từ External API
      const response = await AuthApiService.getAllLicenses(token);

      if (!response.success || !response.data) {
        return {
          success: false,
          message: "Failed to fetch licenses from external API",
          error: response.error || "Unknown error",
        };
      }

      const externalLicenses = response.data;

      let syncedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      // 2 Chuẩn bị danh sách key string từ API
      const keyStrings = externalLicenses.map((k) => k._id); // _id of api === externalId of License

      // 3 Query DB 1 lần duy nhất
      const existingKeys = await License.findAll({
        where: { externalId: keyStrings },
        attributes: [
          "id",
          "externalId",
          "email",
          "machineId",
          "licenseKey",
          "isActive",
          "expiresAt",
          "activatedAt",
          "lastValidatedAt",
        ],
      });

      // 4 Map key → record DB
      const keyMap = new Map<string, License>();
      for (const key of existingKeys) {
        keyMap.set(key.externalId, key);
      }

      // 5 Sync từng key (KHÔNG query DB nữa)
      for (const externalKey of externalLicenses) {
        try {
          const existingKey = keyMap.get(externalKey._id);

          if (existingKey) {
            const updatePayload: {
              isActive?: boolean;
              expiresAt?: Date;
              activatedAt?: Date | null;
              lastValidatedAt?: Date | null;
            } = {};

            // A️⃣ Update isActive
            if (existingKey.isActive !== externalKey.isActive) {
              updatePayload.isActive = externalKey.isActive;
            }

            // B️⃣ Sync expiresAt
            if (existingKey.expiresAt !== externalKey.expiresAt) {
              updatePayload.expiresAt = externalKey.expiresAt;
            }

            // C️⃣ Sync activatedAt
            if (existingKey.activatedAt !== externalKey.activatedAt) {
              updatePayload.activatedAt = externalKey.activatedAt;
            }

            // D Sync lastValidatedAt
            if (existingKey.lastValidatedAt !== externalKey.lastValidatedAt) {
              updatePayload.lastValidatedAt = externalKey.lastValidatedAt;
            }

            if (Object.keys(updatePayload).length > 0) {
              await existingKey.update(updatePayload);
              updatedCount++;
            } else {
              skippedCount++;
            }
          } else {
            // D️⃣ Key chưa tồn tại → create
            await License.create({
              externalId: externalKey._id,
              email: externalKey.email,
              machineId: externalKey.machineId,
              licenseKey: externalKey.licenseKey,
              isActive: externalKey.isActive,
              expiresAt: externalKey.expiresAt,
              activatedAt: externalKey.activatedAt,
              lastValidatedAt: externalKey.lastValidatedAt,
            });
            syncedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync license ${externalKey._id}:`, error);
          skippedCount++;
        }
      }

      return {
        success: true,
        message: "Licenses synced successfully",
        data: {
          synced: syncedCount,
          skipped: skippedCount,
          updated: updatedCount,
        },
      };
    } catch (error) {
      console.error("Sync licenses error:", error);
      return {
        success: false,
        message: "Failed to sync licenses",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Lấy danh sách license keys (chỉ dành cho admin)
   * Có filter theo duration, isUsed, isActive
   */
  static async getAllLicenses({
    query,
  }: {
    query: ILicenseQuery;
  }): Promise<ApiResponse<ILicense[]>> {
    try {
      const { page, limit, email, machineId, externalId, licenseKey, isActive } = query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const where: WhereOptions<ILicense> = {};

      if (email) {
        where.email = {
          [Op.like]: `%${email}%`,
        };
      }

      if (machineId) {
        where.machineId = {
          [Op.like]: `%${machineId}%`,
        };
      }

      if (externalId) {
        where.externalId = {
          [Op.like]: `%${externalId}%`,
        };
      }

      if (isActive !== undefined) {
        // Convert string to boolean if needed
        where.isActive =
          typeof isActive === "string" ? isActive === "true" : isActive;
      }

      // SEARCH THEO LICENSE KEY
      if (licenseKey) {
        where.licenseKey = {
          [Op.like]: `%${licenseKey}%`,
        };
      }

      const licenseKeys = await License.findAll({
        where,
        offset: (pageNum - 1) * limitNum,
        limit: limitNum,
        order: [["createdAt", "DESC"]],
      });

      const total = await License.count({ where });

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
      console.error("Get all licenses error:", error);
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL_ERROR,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }


  static async updateLicense(
    id: string,
    token: string,
    data: ILicenseApiUpdateRequest
  ): Promise<License | null> { 
    try {
      const response = await AuthApiService.updateLicense(id, token, data);
      
      if (!response.success || !response.data) {
        return null;
      }

      const license = await License.findOne({
        where: {
          externalId: id,
        },
      });      

      if (!license) return null;

      await license.update(data);

      return license;
    } catch (error) {    
      Logger.error(`Error update license: ${error}`)  
      return null;
    }
  }
}
