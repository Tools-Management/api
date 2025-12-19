import crypto from "crypto";

/**
 * Generate unique topup code
 * Format: TOPUP_YYYYMMDD_RANDOMSTRING
 */
export const generateTopupCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `TOPUP_${dateStr}_${randomStr}`;
};

/**
 * Generate unique order code
 * Format: ORDER_YYYYMMDD_RANDOMSTRING
 */
export const generateOrderCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `ORDER_${dateStr}_${randomStr}`;
};