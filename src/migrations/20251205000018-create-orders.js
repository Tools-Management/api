'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
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
      orderCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã đơn hàng duy nhất'
      },
      orderType: {
        type: Sequelize.ENUM('license_key', 'product', 'service', 'other'),
        allowNull: false,
        defaultValue: 'license_key',
        comment: 'Loại đơn hàng'
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID của sản phẩm/license key được mua'
      },
      itemType: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Loại item (license_key, product_id, etc)'
      },
      itemDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Chi tiết sản phẩm (duration, name, etc)'
      },
      originalPrice: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Giá gốc (VND)'
      },
      discountAmount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số tiền giảm giá (VND)'
      },
      totalAmount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Tổng tiền phải trả (VND)'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Trạng thái đơn hàng'
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'wallet',
        comment: 'Phương thức thanh toán (wallet, vnpay, bank_transfer, etc)'
      },
      paymentStatus: {
        type: Sequelize.ENUM('unpaid', 'paid', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'unpaid',
        comment: 'Trạng thái thanh toán'
      },
      paymentDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Chi tiết thanh toán'
      },
      walletId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user_wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Wallet ID nếu thanh toán bằng ví'
      },
      transactionCode: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Mã giao dịch thanh toán'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IP address của user'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú đơn hàng'
      },
      cancellationReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lý do hủy đơn'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian hoàn thành'
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian hủy'
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian thanh toán'
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
      comment: 'Bảng quản lý đơn hàng/orders'
    });

    // Tạo indexes
    await queryInterface.addIndex('orders', ['userId'], {
      name: 'idx_orders_userId'
    });

    await queryInterface.addIndex('orders', ['orderCode'], {
      name: 'idx_orders_orderCode',
      unique: true
    });

    await queryInterface.addIndex('orders', ['status'], {
      name: 'idx_orders_status'
    });

    await queryInterface.addIndex('orders', ['paymentStatus'], {
      name: 'idx_orders_paymentStatus'
    });

    await queryInterface.addIndex('orders', ['orderType'], {
      name: 'idx_orders_orderType'
    });

    await queryInterface.addIndex('orders', ['walletId'], {
      name: 'idx_orders_walletId'
    });

    await queryInterface.addIndex('orders', ['createdAt'], {
      name: 'idx_orders_createdAt'
    });

    await queryInterface.addIndex('orders', ['itemId', 'itemType'], {
      name: 'idx_orders_item'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};

