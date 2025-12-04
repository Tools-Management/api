/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('license_keys', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      external_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      key: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      duration: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      purchased_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      purchased_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('license_keys', ['external_id'], {
      unique: true,
      name: 'idx_license_keys_external_id',
    });

    await queryInterface.addIndex('license_keys', ['key'], {
      unique: true,
      name: 'idx_license_keys_key',
    });

    await queryInterface.addIndex('license_keys', ['duration'], {
      name: 'idx_license_keys_duration',
    });

    await queryInterface.addIndex('license_keys', ['is_used'], {
      name: 'idx_license_keys_is_used',
    });

    await queryInterface.addIndex('license_keys', ['is_active'], {
      name: 'idx_license_keys_is_active',
    });

    await queryInterface.addIndex('license_keys', ['purchased_by'], {
      name: 'idx_license_keys_purchased_by',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('license_keys');
  },
};

