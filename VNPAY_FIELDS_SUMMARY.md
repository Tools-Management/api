# VNPay Fields Summary

## ✅ Đã Thêm Vào WalletTopup Model

### Database Fields (Migration 20251205000019)

| Field | Type | Description |
|-------|------|-------------|
| `vnpResponseCode` | VARCHAR(10) | Mã phản hồi từ VNPay (00 = success) |
| `vnpTransactionNo` | VARCHAR(50) | Mã giao dịch từ VNPay |
| `vnpBankCode` | VARCHAR(20) | Mã ngân hàng thanh toán |
| `vnpBankTranNo` | VARCHAR(50) | Mã giao dịch tại ngân hàng |
| `vnpCardType` | VARCHAR(20) | Loại thẻ thanh toán (ATM/QRCODE) |
| `vnpPayDate` | VARCHAR(14) | Thời gian thanh toán (yyyyMMddHHmmss) |
| `vnpOrderInfo` | VARCHAR(255) | Thông tin đơn hàng |
| `vnpSecureHash` | VARCHAR(255) | Chữ ký hash để verify |

### Indexes Đã Tạo

```sql
idx_wallet_topups_vnpResponseCode
idx_wallet_topups_vnpTransactionNo
idx_wallet_topups_vnpBankTranNo
```

## VNPay Response Mapping

### Success Flow

```
VNPay Response → Database Fields

vnp_ResponseCode     → vnpResponseCode (00 = success)
vnp_TransactionNo    → vnpTransactionNo
vnp_BankCode         → vnpBankCode
vnp_BankTranNo       → vnpBankTranNo
vnp_CardType         → vnpCardType
vnp_PayDate          → vnpPayDate
vnp_OrderInfo        → vnpOrderInfo
vnp_SecureHash       → vnpSecureHash
vnp_TxnRef           → topupCode (để match record)
```

### Response Code Examples

| Code | Status | Action |
|------|--------|--------|
| 00 | Success | Complete topup, add balance |
| 07 | Suspicious | Hold for review |
| 24 | Cancelled | Mark as cancelled |
| 51 | Insufficient | Mark as failed |
| 99 | Error | Mark as failed |

## Usage Example

### 1. Khi User Click Nạp Tiền

```typescript
// Create pending topup
const topup = await WalletTopup.create({
  userId: user.id,
  walletId: wallet.id,
  topupCode: generateTopupCode(), // TOPUP_20251205_ABC123
  amount: 100000,
  status: 'pending',
  paymentMethod: 'vnpay',
  ipAddress: req.ip
});

// Redirect to VNPay with topupCode as vnp_TxnRef
```

### 2. Khi VNPay Callback (IPN)

```typescript
import { isVNPaySuccess, getVNPayMessage } from '@/constants/vnpay';

// Find topup by vnp_TxnRef
const topup = await WalletTopup.findOne({
  where: { topupCode: req.query.vnp_TxnRef }
});

// Update with VNPay response
await topup.update({
  vnpResponseCode: req.query.vnp_ResponseCode,
  vnpTransactionNo: req.query.vnp_TransactionNo,
  vnpBankCode: req.query.vnp_BankCode,
  vnpBankTranNo: req.query.vnp_BankTranNo,
  vnpCardType: req.query.vnp_CardType,
  vnpPayDate: req.query.vnp_PayDate,
  vnpOrderInfo: req.query.vnp_OrderInfo,
  vnpSecureHash: req.query.vnp_SecureHash,
  status: isVNPaySuccess(req.query.vnp_ResponseCode) ? 'completed' : 'failed',
  completedAt: isVNPaySuccess(req.query.vnp_ResponseCode) ? new Date() : null,
  failedAt: !isVNPaySuccess(req.query.vnp_ResponseCode) ? new Date() : null,
  transactionCode: req.query.vnp_TransactionNo
});

// If success, add balance
if (isVNPaySuccess(req.query.vnp_ResponseCode)) {
  await wallet.increment('balance', { by: topup.amount });
  await wallet.update({ lastTransactionAt: new Date() });
}
```

### 3. Query Examples

```typescript
// Find all successful transactions
const successfulTopups = await WalletTopup.findAll({
  where: {
    vnpResponseCode: '00',
    status: 'completed'
  }
});

// Find by VNPay transaction number
const topup = await WalletTopup.findOne({
  where: { vnpTransactionNo: '14379159' }
});

// Find by bank transaction number
const topup = await WalletTopup.findOne({
  where: { vnpBankTranNo: 'VNP01420849' }
});

// Get topups by payment method
const atmTopups = await WalletTopup.findAll({
  where: {
    vnpCardType: 'ATM',
    status: 'completed'
  }
});
```

## Security Notes

### 1. Verify Signature

```typescript
import crypto from 'crypto';

const verifyVNPaySignature = (params: any, secureHash: string): boolean => {
  // Sort params
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Create hash
  const signData = sortedParams;
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET!);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  return signed === secureHash;
};
```

### 2. Idempotency Check

```typescript
// Check if already processed
if (topup.status === 'completed' || topup.status === 'failed') {
  // Already processed, return existing result
  return res.json({ 
    RspCode: '00', 
    Message: 'Already processed' 
  });
}
```

### 3. Amount Validation

```typescript
// Verify amount matches
const vnpAmount = parseInt(req.query.vnp_Amount) / 100; // VNPay sends in xu
if (vnpAmount !== topup.amount) {
  throw new Error('Amount mismatch');
}
```

## Files Updated

1. ✅ `migrations/20251205000019-add-vnpay-fields-to-wallet-topups.js`
2. ✅ `models/WalletTopup.ts`
3. ✅ `types/wallet.ts`
4. ✅ `constants/vnpay.ts` (NEW)
5. ✅ `WALLET_ORDER_SYSTEM.md`

## Next Implementation Steps

1. Create `VNPayService` class
2. Create `WalletService` with transaction handling
3. Create wallet controller with callback endpoint
4. Setup VNPay environment variables
5. Add webhook endpoint for IPN
6. Add comprehensive logging
7. Add monitoring & alerting

## Environment Variables Needed

```env
# VNPay Configuration
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/api/v1/wallet/vnpay/return
VNPAY_IPN_URL=https://yourdomain.com/api/v1/wallet/vnpay/ipn
```

