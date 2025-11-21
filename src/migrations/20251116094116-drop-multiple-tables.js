'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('product_tech_stacks'); // bảng con
    await queryInterface.dropTable('tech_stacks'); // bảng con
    await queryInterface.dropTable('product_images'); // bảng con
    await queryInterface.dropTable('products');       // bảng cha
    await queryInterface.dropTable('categories');

    console.warn('This migration drops tables permanently. No rollback available.');

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
