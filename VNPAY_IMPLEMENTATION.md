# VNPay Integration Implementation Guide

## ✅ Đã Hoàn Thành

### 1. Database Schema
- ✅ `user_wallets` table - Ví tiền user
- ✅ `wallet_topups` table - Lịch sử nạp tiền với VNPay fields
- ✅ `orders` table - Đơn hàng

### 2. Models
- ✅ `UserWallet.ts` - Model ví tiền
- ✅ `WalletTopup.ts` - Model nạp tiền (8 VNPay fields)
- ✅ `Order.ts` - Model đơn hàng
- ✅ Associations trong `models/index.ts`

### 3. Configuration
- ✅ `config/vnpay.config.ts` - VNPay config (readonly constants + env)
- ✅ `constants/vnpay.ts` - Response codes & helpers
- ✅ `lib/env.ts` - Environment variables
- ✅ `env.example` - VNPay credentials template

### 4. Utils
- ✅ `utils/vnpay.utils.ts` - Signature, validation, formatting

### 5. Services
- ✅ `services/vnpay.service.ts` - VNPay payment URL & callback verification
- ✅ `services/wallet.service.ts` - Wallet business logic với transactions

### 6. Controllers
- ✅ `controllers/wallet.controller.ts` - HTTP handlers

### 7. Routes
- ✅ `routes/wallet.routes.ts` - Wallet endpoints
- ✅ Registered trong `routes/index.ts`

## 🔧 Setup Instructions

### Bước 1: Environment Variables

Copy và điền thông tin vào `.env`:

```bash
# VNPay Configuration
VNPAY_TMN_CODE=YOUR_MERCHANT_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=http://localhost:8000/api/v1/wallet/vnpay/return
VNPAY_IPN_URL=http://localhost:8000/api/v1/wallet/vnpay/ipn
```

**Lấy credentials:**
- Sandbox: https://sandbox.vnpayment.vn/merchantv2/
- Production: https://vnpay.vn

### Bước 2: Run Migrations

```bash
# Run migrations to create tables
npm run migrate

# Or run specific migrations
npx sequelize-cli db:migrate --to 20251205000019-add-vnpay-fields-to-wallet-topups.js
```

### Bước 3: Start Server

```bash
npm run dev
```

Server sẽ validate VNPay config khi khởi động.

## 📡 API Endpoints

### Wallet Endpoints

#### 1. Get Wallet Info
```http
GET /api/v1/wallet
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "balance": 1000000,
    "currency": "VND",
    "isActive": true,
    "lastTransactionAt": "2025-12-05T10:00:00Z"
  }
}
```

#### 2. Get Balance
```http
GET /api/v1/wallet/balance
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "balance": 1000000,
    "currency": "VND"
  }
}
```

#### 3. Create Topup (Nạp Tiền)
```http
POST /api/v1/wallet/topup
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "amount": 100000,
  "paymentMethod": "vnpay",
  "notes": "Nạp tiền vào ví"
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "topupCode": "TOPUP_20251205_A1B2C3D4",
    "amount": 100000
  },
  "message": "Topup request created. Redirecting to payment gateway..."
}
```

**Frontend Flow:**
```javascript
// Call API
const response = await fetch('/api/v1/wallet/topup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 100000 })
});

const data = await response.json();

// Redirect user to VNPay
window.location.href = data.data.paymentUrl;
```

#### 4. VNPay Return URL
```http
GET /api/v1/wallet/vnpay/return?vnp_Amount=...&vnp_ResponseCode=00&...

User được redirect về sau khi thanh toán.
Response: Redirect to frontend với query params
```

#### 5. VNPay IPN (Webhook)
```http
GET /api/v1/wallet/vnpay/ipn?vnp_Amount=...&vnp_ResponseCode=00&...

VNPay server gọi endpoint này để confirm payment.
Response:
{
  "RspCode": "00",
  "Message": "Success"
}
```

**IPN Response Codes:**
- `00`: Confirm success
- `01`: Order not found
- `02`: Order already updated
- `04`: Amount invalid
- `97`: Checksum failed
- `99`: Unknown error

#### 6. Get Topup History
```http
GET /api/v1/wallet/topups?page=1&limit=20&status=completed
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "topupCode": "TOPUP_20251205_ABC",
      "amount": 100000,
      "status": "completed",
      "vnpResponseCode": "00",
      "vnpBankCode": "VCB",
      "vnpCardType": "ATM",
      "completedAt": "2025-12-05T10:30:00Z",
      "createdAt": "2025-12-05T10:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 7. Get Topup Detail
```http
GET /api/v1/wallet/topups/TOPUP_20251205_ABC
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "topupCode": "TOPUP_20251205_ABC",
    "amount": 100000,
    "status": "completed",
    "vnpResponseCode": "00",
    "vnpTransactionNo": "14379159",
    "vnpBankCode": "VCB",
    "vnpBankTranNo": "VNP01420849",
    "vnpCardType": "ATM",
    "vnpPayDate": "20251205103000",
    ...
  }
}
```

## 🔐 Security Features Implemented

### 1. Signature Verification
- ✅ HMAC SHA512 verification cho mọi VNPay callback
- ✅ Prevent tampering với params

### 2. Idempotency
- ✅ Check if topup already processed
- ✅ Return proper response nếu duplicate IPN call

### 3. Database Transactions
- ✅ SERIALIZABLE isolation level
- ✅ Row-level locking khi update balance
- ✅ Atomic operations - rollback on error

### 4. Amount Validation
- ✅ Min/Max amount limits
- ✅ Verify VNPay amount matches DB amount
- ✅ Prevent over-crediting

### 5. Rate Limiting
- ✅ Strict rate limit cho topup endpoint
- ✅ General rate limit cho queries

### 6. Input Sanitization
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Security headers

### 7. Logging
- ✅ Log all topup creations
- ✅ Log VNPay callbacks (sanitized)
- ✅ Error logging

## 🧪 Testing Checklist

### Unit Tests
- [ ] VNPay signature generation
- [ ] VNPay signature verification
- [ ] Amount conversion (VND ↔ xu)
- [ ] Date formatting
- [ ] Code generation

### Integration Tests
- [ ] Create wallet for new user
- [ ] Create topup request
- [ ] Process VNPay IPN success
- [ ] Process VNPay IPN failure
- [ ] Handle duplicate IPN
- [ ] Validate amount mismatch
- [ ] Handle invalid signature
- [ ] Concurrent topup processing

### E2E Tests
- [ ] Full nạp tiền flow (request → VNPay → callback → balance update)
- [ ] User cancel payment
- [ ] Payment timeout
- [ ] Network error handling

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Production
NODE_ENV=production npm run migrate
```

### 2. Environment Variables
Update `.env` với production VNPay credentials:
```
VNPAY_TMN_CODE=PROD_CODE
VNPAY_HASH_SECRET=PROD_SECRET
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/api/v1/wallet/vnpay/return
VNPAY_IPN_URL=https://yourdomain.com/api/v1/wallet/vnpay/ipn
```

### 3. VNPay Portal Setup
- Login vào VNPay merchant portal
- Configure IPN URL: `https://yourdomain.com/api/v1/wallet/vnpay/ipn`
- Configure Return URL: `https://yourdomain.com/api/v1/wallet/vnpay/return`
- Whitelist server IP

### 4. SSL/HTTPS
- ⚠️ **REQUIRED**: VNPay requires HTTPS for IPN in production
- Setup SSL certificate (Let's Encrypt hoặc CloudFlare)

### 5. Monitoring
- Monitor VNPay callback success rate
- Alert on failed transactions
- Track balance reconciliation

## 📊 Flow Diagrams

### Nạp Tiền Flow

```
User → Frontend → API: POST /wallet/topup
                       ↓
                  Create WalletTopup (status=pending)
                       ↓
                  Generate VNPay URL
                       ↓
                  Return paymentUrl
                       ↓
User → VNPay Gateway → Thanh toán
                       ↓
                  VNPay → API: GET /vnpay/ipn
                       ↓
                  Verify signature ✓
                       ↓
                  Find WalletTopup by topupCode
                       ↓
                  Check idempotency
                       ↓
                  Validate amount
                       ↓
              [START TRANSACTION]
                       ↓
              Update WalletTopup (status=completed)
                       ↓
              Update UserWallet (balance += amount)
                       ↓
              [COMMIT TRANSACTION]
                       ↓
                  Return { RspCode: '00' }
                       ↓
User ← VNPay: Redirect to return URL
                       ↓
               Frontend: Success page
```

## 🐛 Common Issues & Solutions

### Issue 1: Signature verification failed
**Cause**: Hash secret không khớp hoặc params bị modify
**Solution**: 
- Check VNPAY_HASH_SECRET
- Log params được gửi đi và nhận về
- Ensure params are sorted alphabetically

### Issue 2: Amount mismatch
**Cause**: VNPay amount (xu) vs DB amount (VND) conversion sai
**Solution**: Always use `toVNPayAmount()` và `fromVNPayAmount()`

### Issue 3: Duplicate IPN calls
**Cause**: VNPay retry mechanism
**Solution**: Idempotency check - return `RspCode: '02'` if already processed

### Issue 4: Balance not updated
**Cause**: Transaction rollback hoặc IPN không được gọi
**Solution**:
- Check logs
- Manually verify VNPay transaction
- Use querydr API to check status

## 📞 Support

- VNPay Sandbox: https://sandbox.vnpayment.vn
- VNPay Docs: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
- VNPay Support: support@vnpay.vn

## Next Features to Implement

- [ ] Order service (mua license key bằng wallet)
- [ ] Webhook retry mechanism
- [ ] Admin dashboard cho wallet management
- [ ] Export transaction history
- [ ] Refund API
- [ ] Query transaction status API

