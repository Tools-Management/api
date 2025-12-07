'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_topups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User ID'
      },
      walletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user_wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Wallet ID'
      },
      topupCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã nạp tiền duy nhất'
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Số tiền nạp (VND)'
      },
      transactionCode: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Mã giao dịch từ VNPay/payment gateway'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Trạng thái nạp tiền'
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'vnpay',
        comment: 'Phương thức thanh toán (vnpay, bank_transfer, momo, etc)'
      },
      paymentDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Chi tiết thanh toán (response từ payment gateway)'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IP address của user khi nạp tiền'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian hoàn thành'
      },
      failedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian thất bại'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: 'Bảng lịch sử nạp tiền vào ví'
    });

    // Tạo indexes
    await queryInterface.addIndex('wallet_topups', ['userId'], {
      name: 'idx_wallet_topups_userId'
    });

    await queryInterface.addIndex('wallet_topups', ['walletId'], {
      name: 'idx_wallet_topups_walletId'
    });

    await queryInterface.addIndex('wallet_topups', ['topupCode'], {
      name: 'idx_wallet_topups_topupCode',
      unique: true
    });

    await queryInterface.addIndex('wallet_topups', ['transactionCode'], {
      name: 'idx_wallet_topups_transactionCode'
    });

    await queryInterface.addIndex('wallet_topups', ['status'], {
      name: 'idx_wallet_topups_status'
    });

    await queryInterface.addIndex('wallet_topups', ['createdAt'], {
      name: 'idx_wallet_topups_createdAt'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wallet_topups');
  }
};

