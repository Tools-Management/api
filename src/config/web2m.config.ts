import { ENV } from "@/lib/env";

const WEB2M_CONFIG = {
  apiGetQrUrl: ENV.API_GET_QR,
  apiGetTransactionUrl: ENV.API_GET_TRANSACTION,
  bankToken: ENV.BANK_TOKEN,
  bankPassword: ENV.BANK_PASSWORD,
  bankName: ENV.BANK_NAME,
  bankNumber: ENV.BANK_NUMBER,
  accountHolder: ENV.BANK_ACCOUNT_HOLDER,
  isMask: ENV.IS_MASK || "0",
  bankBackground: ENV.BANK_BACKGROUND || "13",
};

export default WEB2M_CONFIG;
