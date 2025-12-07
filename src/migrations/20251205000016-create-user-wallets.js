'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_wallets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User ID - mỗi user chỉ có 1 wallet'
      },
      balance: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số dư hiện tại (đơn vị: VND)'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'VND',
        comment: 'Loại tiền tệ'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Trạng thái ví'
      },
      lastTransactionAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian giao dịch cuối cùng'
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
      comment: 'Bảng quản lý ví tiền của user'
    });

    // Tạo indexes
    await queryInterface.addIndex('user_wallets', ['userId'], {
      name: 'idx_user_wallets_userId',
      unique: true
    });

    await queryInterface.addIndex('user_wallets', ['isActive'], {
      name: 'idx_user_wallets_isActive'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_wallets');
  }
};

