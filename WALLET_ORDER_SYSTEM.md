# Hệ Thống Ví Tiền & Đơn Hàng (Wallet & Order System)

## Tổng Quan

Hệ thống quản lý ví tiền điện tử và đơn hàng cho phép user:
- Nạp tiền vào ví qua VNPay
- Sử dụng số dư ví để mua license key
- Theo dõi lịch sử giao dịch và đơn hàng

## Database Schema

### 1. **user_wallets** - Ví tiền của user

```sql
- id (PK)
- userId (FK to users, UNIQUE) - Mỗi user chỉ có 1 ví
- balance (BIGINT) - Số dư hiện tại (VND)
- currency (VARCHAR) - Loại tiền tệ (default: VND)
- isActive (BOOLEAN) - Trạng thái ví
- lastTransactionAt (DATETIME) - Thời gian giao dịch cuối
- createdAt, updatedAt
```

### 2. **wallet_topups** - Lịch sử nạp tiền

```sql
- id (PK)
- userId (FK to users)
- walletId (FK to user_wallets)
- topupCode (VARCHAR, UNIQUE) - Mã nạp tiền (dùng làm vnp_TxnRef)
- amount (BIGINT) - Số tiền nạp
- transactionCode (VARCHAR) - Mã GD từ VNPay
- status (ENUM) - pending, processing, completed, failed, refunded, cancelled
- paymentMethod (VARCHAR) - vnpay, bank_transfer, momo, etc
- paymentDetails (JSON) - Chi tiết từ payment gateway
- ipAddress (VARCHAR)
- notes (TEXT)

-- VNPay Specific Fields
- vnpResponseCode (VARCHAR) - Mã phản hồi VNPay (00 = success)
- vnpTransactionNo (VARCHAR) - Mã giao dịch VNPay
- vnpBankCode (VARCHAR) - Mã ngân hàng thanh toán
- vnpBankTranNo (VARCHAR) - Mã giao dịch tại ngân hàng
- vnpCardType (VARCHAR) - Loại thẻ (ATM/QRCODE)
- vnpPayDate (VARCHAR) - Thời gian thanh toán (yyyyMMddHHmmss)
- vnpOrderInfo (VARCHAR) - Thông tin đơn hàng
- vnpSecureHash (VARCHAR) - Chữ ký hash để verify

- completedAt, failedAt
- createdAt, updatedAt
```

**VNPay Response Codes:**
- `00`: Giao dịch thành công
- `07`: Trừ tiền thành công, nghi ngờ giao dịch bất thường
- `09`: Thẻ/Tài khoản chưa đăng ký InternetBanking
- `10`: Xác thực thông tin sai quá 3 lần
- `11`: Hết hạn chờ thanh toán
- `12`: Thẻ/Tài khoản bị khóa
- `24`: Khách hàng hủy giao dịch
- `51`: Không đủ số dư
- `65`: Vượt hạn mức giao dịch
- `75`: Ngân hàng bảo trì
- `79`: Sai mật khẩu quá số lần
- `99`: Lỗi không xác định

### 3. **orders** - Đơn hàng

```sql
- id (PK)
- userId (FK to users)
- orderCode (VARCHAR, UNIQUE) - Mã đơn hàng
- orderType (ENUM) - license_key, product, service, other
- itemId (INT) - ID của license key/product
- itemType (VARCHAR) - Loại item
- itemDetails (JSON) - Chi tiết sản phẩm
- originalPrice (BIGINT) - Giá gốc
- discountAmount (BIGINT) - Số tiền giảm giá
- totalAmount (BIGINT) - Tổng tiền
- status (ENUM) - pending, processing, completed, cancelled, refunded, failed
- paymentMethod (VARCHAR) - wallet, vnpay, etc
- paymentStatus (ENUM) - unpaid, paid, refunded, partially_refunded
- paymentDetails (JSON)
- walletId (FK to user_wallets)
- transactionCode (VARCHAR)
- ipAddress (VARCHAR)
- notes (TEXT)
- cancellationReason (TEXT)
- completedAt, cancelledAt, paidAt
- createdAt, updatedAt
```

## Relationships

```
User (1) -----> (1) UserWallet
User (1) -----> (N) WalletTopup
User (1) -----> (N) Order
User (1) -----> (N) LicenseKey

UserWallet (1) -----> (N) WalletTopup
UserWallet (1) -----> (N) Order
```

## Business Logic Flow

### Flow 1: Nạp Tiền Vào Ví

```
1. User request nạp tiền
   POST /api/v1/wallet/topup
   Body: { amount: 100000, paymentMethod: 'vnpay' }

2. System tạo WalletTopup record với status='pending'
   - Generate topupCode unique
   - Lưu thông tin user, amount, ipAddress

3. Redirect user đến VNPay payment gateway
   - Truyền topupCode làm order_id
   - VNPay return url callback

4. VNPay callback (IPN - Instant Payment Notification)
   POST /api/v1/wallet/topup/callback
   - Verify signature từ VNPay
   - Update WalletTopup status = 'completed'
   - Cộng tiền vào UserWallet.balance
   - Update lastTransactionAt

5. Return page thông báo thành công
```

### Flow 2: Mua License Key Bằng Ví

```
1. User chọn license key duration và click mua
   POST /api/v1/orders/create
   Body: {
     orderType: 'license_key',
     itemDetails: { duration: '30d' },
     totalAmount: 300000,
     paymentMethod: 'wallet'
   }

2. System validate:
   - Check UserWallet.balance >= totalAmount
   - Check license key availability

3. Tạo Order record với status='pending'
   - Generate orderCode unique
   - Lock balance (optional: tạo transaction pending)

4. Execute transaction (ATOMIC):
   - Trừ tiền wallet: UserWallet.balance -= totalAmount
   - Tìm license key available (isUsed=false, duration match)
   - Update LicenseKey: 
     * isUsed = true
     * purchasedBy = userId
     * purchasedAt = now()
   - Update Order:
     * status = 'completed'
     * paymentStatus = 'paid'
     * paidAt = now()
     * completedAt = now()
     * itemId = licenseKeyId

5. Return license key to user
```

### Flow 3: Refund/Hủy Đơn

```
1. User/Admin request hủy đơn
   PUT /api/v1/orders/:orderCode/cancel
   Body: { reason: 'User request cancel' }

2. System validate:
   - Order status must be 'pending' or 'processing'
   - Check if eligible for refund

3. Execute refund (ATOMIC):
   - Update Order:
     * status = 'cancelled'
     * paymentStatus = 'refunded'
     * cancelledAt = now()
     * cancellationReason = reason
   - If paid by wallet:
     * Cộng lại tiền: UserWallet.balance += totalAmount
     * Update lastTransactionAt
   - If license key was assigned:
     * Return key to pool: LicenseKey.isUsed = false
     * Clear purchasedBy, purchasedAt

4. Notify user
```

## API Endpoints (Cần Implement)

### Wallet Endpoints

```
GET    /api/v1/wallet              - Lấy thông tin ví
POST   /api/v1/wallet/topup        - Tạo yêu cầu nạp tiền
POST   /api/v1/wallet/topup/callback - VNPay callback
GET    /api/v1/wallet/topups       - Lịch sử nạp tiền
GET    /api/v1/wallet/balance      - Số dư hiện tại
```

### Order Endpoints

```
POST   /api/v1/orders              - Tạo đơn hàng
GET    /api/v1/orders              - Danh sách đơn hàng
GET    /api/v1/orders/:orderCode   - Chi tiết đơn hàng
PUT    /api/v1/orders/:orderCode/cancel - Hủy đơn hàng
GET    /api/v1/orders/stats        - Thống kê đơn hàng
```

## Security Considerations

### 1. Race Conditions

**Problem**: Multiple requests cùng lúc có thể gây oversell license keys hoặc double-spend wallet balance

**Solution**:
- Sử dụng Database Transactions với SERIALIZABLE isolation level
- Row-level locking khi update balance
- Optimistic locking với version field

```typescript
// Example
await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
}, async (t) => {
  // Lock wallet row
  const wallet = await UserWallet.findOne({
    where: { userId },
    lock: t.LOCK.UPDATE,
    transaction: t
  });
  
  // Check balance
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Update balance
  await wallet.update(
    { balance: wallet.balance - amount },
    { transaction: t }
  );
  
  // Other operations...
});
```

### 2. VNPay Security

- Verify signature cho mọi callback từ VNPay
- Validate amount, orderCode match với DB
- Idempotent processing (check if already processed)
- Log tất cả VNPay transactions

### 3. Balance Integrity

- Không bao giờ trust client-side balance
- Always query from DB
- Use BIGINT cho amount (avoid float precision issues)
- Regular reconciliation job

## Migration Commands

```bash
# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Rollback all migrations
npm run migrate:undo:all

# Run specific migration
npx sequelize-cli db:migrate --to 20251205000018-create-orders.js
```

## Testing Checklist

- [ ] Tạo wallet tự động khi user register
- [ ] Nạp tiền thành công và cập nhật balance
- [ ] Handle VNPay callback duplicates
- [ ] Mua license key với sufficient balance
- [ ] Reject purchase với insufficient balance
- [ ] Concurrent purchase requests không oversell
- [ ] Refund order và return license key
- [ ] Query performance với large dataset
- [ ] Validate all enum values
- [ ] Test payment gateway failures

## Next Steps

1. ✅ Create migrations
2. ✅ Create models
3. ✅ Define types
4. ✅ Setup associations
5. ⏳ Implement services (WalletService, OrderService)
6. ⏳ Implement controllers
7. ⏳ Create routes
8. ⏳ Integrate VNPay SDK
9. ⏳ Add tests
10. ⏳ Add monitoring & alerts

## VNPay Integration Guide

Xem file riêng: `VNPAY_INTEGRATION.md`

