import axios from "axios";
import CONFIG from "@/config/web2m.config";
import {
  IWeb2MCreateTopupRequest,
  IWeb2MTransaction,
  IWeb2MTransactionApiResponse,
  TypeTransaction,
} from "@/types/web2m.type";
import WalletService from "./wallet.service";
import { PAYMENT_METHOD, TOPUP_STATUS } from "@/types";
import { UserWallet, WalletTopup } from "@/models";
import { Op } from "sequelize";
import { Logger } from "@/lib";

const TOPUP_REGEX = /TOPUP(\d{8})([A-Za-z0-9]{8,})/i;
export class Web2MService {
  private static async getTranssactionHistory(): Promise<IWeb2MTransaction[]> {
    const { apiGetTransactionUrlV2, bankToken } =
      CONFIG;

    const transactionUrl = `${apiGetTransactionUrlV2}/${bankToken}`;

    const { data } = await axios.get<IWeb2MTransactionApiResponse>(
      transactionUrl
    );

    // 1) Token invalid
    // if (data.status === Web2MErrorCode.INVALID_TOKEN) {
    //   throw new Error(
    //     "Không get được lịch sử giao dịch. Vui lòng kiểm tra lại cấu hình web."
    //   );
    // }

    // 2) Other failures (status === false OR undefined OR unexpected number)
    if (data.success !== true) {
      // nếu muốn, có thể ưu tiên message từ API
      const msg =
        data.message || "Không get được lịch sử giao dịch từ hệ thống";
      throw new Error(msg);
    }

    // 3) Filter transactions success & plus money
    data.transactions = data.transactions?.filter(
      (tx) => tx.type === TypeTransaction.PLUS_MONEY
    );

    return data.transactions ?? [];
  }

  /**
   * Trích xuất mã TOPUP một cách AN TOÀN và CHÍNH XÁC bằng regex
   * Ví dụ: "TOPUP2025122282010129" hoặc "TOPUP2025122225ACB177"
   */
  private static extractTopupCode(description: string): string | null {
    if (!description) return null;

    const match = description.match(TOPUP_REGEX);
    if (!match) return null;

    const datePart = match[1]; // 20251222
    const randomPart = match[2]; // 82010129 hoặc 25ACB177

    return `TOPUP${datePart}${randomPart}`;
  }

  private static async scheduleCheck(
    userId: number,
    retry: number = 0,
    maxRetry: number = 3
  ): Promise<void> {
    setTimeout(async () => {
      try {
        const success = await this.checkSuccessfulTopup(userId);

        if (!success && retry < maxRetry) {
          await this.scheduleCheck(userId, retry + 1, maxRetry);
        }
      } catch (err) {
        Logger.error(`[TOPUP CHECK ERROR]: ${err}`);

        if (retry < maxRetry) {
          await this.scheduleCheck(userId, retry + 1, maxRetry);
        }
      }
    }, 60_000);
  }

  private static parseTransactionDate(dateStr?: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.trim().split(/[/\s:]/);

    // Kiểm tra độ dài mảng trước khi truy cập phần tử
    if (parts.length < 3) return null;

    // Destructuring + default empty string để TypeScript yên tâm
    const [dayStr = "", monthStr = "", yearStr = ""] = parts;

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const date = new Date(Date.UTC(year, month, day, 0, 0, 0));

    return isNaN(date.getTime()) ? null : date;
  }

  static async checkSuccessfulTopup(userId: number): Promise<boolean> {
    const transactions = await this.getTranssactionHistory();

    if (!transactions || transactions.length === 0) return false;

    // Only check topups within last 4 hours
    const twelveHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const pendingTopups = await WalletTopup.findAll({
      where: {
        userId,
        status: TOPUP_STATUS.PENDING,
        paymentMethod: PAYMENT_METHOD.QR_PAY,
        createdAt: {
          [Op.gte]: twelveHoursAgo,
        },
      },
      attributes: ["id", "amount", "topupCode", "createdAt"],
    });

    if (pendingTopups.length === 0) return false;

    for (const tx of transactions) {
      if (!tx.description) continue;

      const txDate = this.parseTransactionDate(tx.postingDate);
      if (!txDate) continue;

      const txTopupCode = this.extractTopupCode(tx.description);
      if (!txTopupCode) continue;

      const matchedTopup = pendingTopups.find((topup) => {
        // So sánh chỉ ngày (bỏ giờ/phút/giây)
        const txDayStart = new Date(
          txDate.getFullYear(),
          txDate.getMonth(),
          txDate.getDate()
        );
        const createdDayStart = new Date(
          topup.createdAt.getFullYear(),
          topup.createdAt.getMonth(),
          topup.createdAt.getDate()
        );

        const isCodeMatch =
          topup.topupCode.toUpperCase() === txTopupCode.toUpperCase();
        const isAmountMatch =
          Math.abs(Number(tx.amount) - Number(topup.amount)) < 1;
        const isDateMatch = txDayStart.getTime() >= createdDayStart.getTime(); // Ngày giao dịch >= ngày tạo QR

        return isCodeMatch && isAmountMatch && isDateMatch;
      });

      if (!matchedTopup) continue;

      // MATCH successful topup
      await matchedTopup.update({
        status: TOPUP_STATUS.COMPLETED,
        completedAt: new Date(),
        transactionCode: tx.transactionID,
      });

      // Find user's wallet
      const wallet = await UserWallet.findOne({
        where: { userId },
      });

      // Update wallet balance and last transaction time
      if (wallet) {
        // Calculate new balance
        const newBalance = Number(wallet.balance) + Number(tx.amount);

        await wallet.update({
          balance: newBalance,
          lastTransactionAt: new Date(),
        });
      }

      Logger.info(
        `User với ID: ${userId} đã nạp tiền thành công - Đã cập nhật topup ID: ${matchedTopup.id}`
      );

      return true;
    }
    Logger.error(
      `User với ID: ${userId} đã nạp tiền LỖI!!!`
    );

    return false;
  }

  static async getQrCodeImage(amount: number, memo: string): Promise<Buffer> {
    const {
      apiGetQrUrl,
      bankName,
      bankNumber,
      accountHolder,
      isMask,
      bankBackground,
    } = CONFIG;

    let url = `${apiGetQrUrl}/${bankName}/${bankNumber}/${accountHolder}?is_mask=${isMask}&bg=${bankBackground}`;

    if (amount) {
      url += `&amount=${amount}`;
    }
    if (memo) {
      url += `&memo=${encodeURIComponent(memo)}`;
    }

    const res = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
    });

    return Buffer.from(res.data);
  }

  static async createTopupRequest(
    userId: number,
    data: IWeb2MCreateTopupRequest
  ): Promise<boolean> {
    const { amount, memo } = data;

    if (amount <= 0 || isNaN(amount)) {
      throw new Error("'amount' must be a positive number");
    }

    if (!amount || !memo) {
      throw new Error("At least one of 'amount' or 'memo' must be provided");
    }

    const walletResult = await WalletService.getOrCreateWallet(userId);

    if (!walletResult.success || !walletResult.data) {
      return false;
    }

    const wallet = walletResult.data;
    const topupCode = memo;

    const requestData = {
      userId,
      walletId: wallet.id,
      topupCode,
      amount,
      status: TOPUP_STATUS.PENDING,
      paymentMethod: PAYMENT_METHOD.QR_PAY,
      notes: "Nạp tiền qua QR Pay",
    };

    await WalletTopup.create(requestData);

    // trigger background check
    this.scheduleCheck(userId);

    return true;
  }
}
