'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove unique constraint from username column
    await queryInterface.changeColumn('users', 'username', {
      type: Sequelize.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    });

    // Remove unique index on username
    await queryInterface.removeIndex('users', 'users_username_unique');
  },

  async down (queryInterface, Sequelize) {
    // Revert: Add back unique constraint to username column
    await queryInterface.changeColumn('users', 'username', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    });

    // Revert: Add back unique index on username
    await queryInterface.addIndex('users', ['username'], {
      unique: true,
      name: 'users_username_unique'
    });
  }
};
