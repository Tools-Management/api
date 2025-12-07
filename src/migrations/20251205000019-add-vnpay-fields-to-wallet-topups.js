'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm các fields cho VNPay response
    await queryInterface.addColumn('wallet_topups', 'vnpResponseCode', {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: 'Mã phản hồi từ VNPay (00 = success)',
      after: 'transactionCode'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpTransactionNo', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Mã giao dịch VNPay (vnp_TransactionNo)',
      after: 'vnpResponseCode'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpBankCode', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Mã ngân hàng thanh toán',
      after: 'vnpTransactionNo'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpBankTranNo', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Mã giao dịch tại ngân hàng',
      after: 'vnpBankCode'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpCardType', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Loại thẻ thanh toán (ATM/QRCODE)',
      after: 'vnpBankTranNo'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpPayDate', {
      type: Sequelize.STRING(14),
      allowNull: true,
      comment: 'Thời gian thanh toán VNPay (yyyyMMddHHmmss)',
      after: 'vnpCardType'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpOrderInfo', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Thông tin đơn hàng từ VNPay',
      after: 'vnpPayDate'
    });

    await queryInterface.addColumn('wallet_topups', 'vnpSecureHash', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Chữ ký hash từ VNPay để verify',
      after: 'vnpOrderInfo'
    });

    // Thêm index cho vnpResponseCode và vnpTransactionNo
    await queryInterface.addIndex('wallet_topups', ['vnpResponseCode'], {
      name: 'idx_wallet_topups_vnpResponseCode'
    });

    await queryInterface.addIndex('wallet_topups', ['vnpTransactionNo'], {
      name: 'idx_wallet_topups_vnpTransactionNo'
    });

    await queryInterface.addIndex('wallet_topups', ['vnpBankTranNo'], {
      name: 'idx_wallet_topups_vnpBankTranNo'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('wallet_topups', 'idx_wallet_topups_vnpResponseCode');
    await queryInterface.removeIndex('wallet_topups', 'idx_wallet_topups_vnpTransactionNo');
    await queryInterface.removeIndex('wallet_topups', 'idx_wallet_topups_vnpBankTranNo');

    // Remove columns
    await queryInterface.removeColumn('wallet_topups', 'vnpSecureHash');
    await queryInterface.removeColumn('wallet_topups', 'vnpOrderInfo');
    await queryInterface.removeColumn('wallet_topups', 'vnpPayDate');
    await queryInterface.removeColumn('wallet_topups', 'vnpCardType');
    await queryInterface.removeColumn('wallet_topups', 'vnpBankTranNo');
    await queryInterface.removeColumn('wallet_topups', 'vnpBankCode');
    await queryInterface.removeColumn('wallet_topups', 'vnpTransactionNo');
    await queryInterface.removeColumn('wallet_topups', 'vnpResponseCode');
  }
};

