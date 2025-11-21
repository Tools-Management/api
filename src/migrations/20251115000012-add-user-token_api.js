'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'token_api', {
      type: Sequelize.STRING(500),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
      field: 'token_api',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'token_api');
  }
};


