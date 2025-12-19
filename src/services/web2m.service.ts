import axios from "axios";
import CONFIG from "@/config/web2m.config";
import {
  IWeb2MCreateTopupRequest,
  IWeb2MTransaction,
  IWeb2MTransactionApiResponse,
  TypeTransaction,
  Web2MErrorCode,
} from "@/types/web2m.type";
import WalletService from "./wallet.service";
import { PAYMENT_METHOD, TOPUP_STATUS } from "@/types";
import { generateTopupCode } from "@/utils/web2m.utils";
import { WalletTopup } from "@/models";

export class Web2MService {
  private static async getTranssactionHistory(): Promise<IWeb2MTransaction[]> {
    const { apiGetTransactionUrl, bankNumber, bankToken, bankPassword } =
      CONFIG;

    const transactionUrl = `${apiGetTransactionUrl}/${bankPassword}/${bankNumber}/${bankToken}`;

    const { data } = await axios.get<IWeb2MTransactionApiResponse>(
      transactionUrl
    );

    // 1) Token invalid
    if (data.status === Web2MErrorCode.INVALID_TOKEN) {
      throw new Error(
        "Không get được lịch sử giao dịch. Vui lòng kiểm tra lại cấu hình web."
      );
    }

    // 2) Other failures (status === false OR undefined OR unexpected number)
    if (data.status !== true) {
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

  private static extractTopupCode(description: string): string | null {
    const parts = description.split(".");
    const code = parts[3];

    if (!code) return null;

    return code.trim();
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
        console.error("[TOPUP CHECK ERROR]", err);

        if (retry < maxRetry) {
          await this.scheduleCheck(userId, retry + 1, maxRetry);
        }
      }
    }, 60_000);
  }

  static async checkSuccessfulTopup(userId: number): Promise<boolean> {
    const transactions = await this.getTranssactionHistory();
    if (!transactions || transactions.length === 0) return false;

    const pendingTopups = await WalletTopup.findAll({
      where: {
        userId,
        status: TOPUP_STATUS.PENDING,
        paymentMethod: PAYMENT_METHOD.QR_PAY,
      },
      attributes: ["id", "amount", "topupCode", "createdAt"],
    });

    for (const tx of transactions) {
      if (!tx.description) continue;

      const txTopupCode = this.extractTopupCode(tx.description);
      if (!txTopupCode) continue;

      const matchedTopup = pendingTopups.find(
        (topup) =>
          topup.topupCode === txTopupCode &&
          Number(tx.amount) === Number(topup.amount) &&
          new Date(tx.transactionDate).getTime() >=
            new Date(topup.createdAt).getTime()
      );

      if (!matchedTopup) continue;

      // MATCH successful topup
      await matchedTopup.update({
        status: TOPUP_STATUS.COMPLETED,
        completedAt: new Date(),
        transactionCode: tx.transactionID,
      });
      return true;
    }
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
    const topupCode = generateTopupCode();

    const requestData = {
      userId,
      walletId: wallet.id,
      topupCode,
      amount,
      status: TOPUP_STATUS.PENDING,
      paymentMethod: PAYMENT_METHOD.QR_PAY,
      notes: memo,
    };

    await WalletTopup.create(requestData);

    // trigger background check
    this.scheduleCheck(userId);

    return true;
  }
}
