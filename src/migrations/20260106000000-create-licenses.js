const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('licenses', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      external_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      machine_id: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      license_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      activated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastValidated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('licenses', ['machine_id']);
    await queryInterface.addIndex('licenses', ['license_key']);
    await queryInterface.addIndex('licenses', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('licenses');
  },
};





