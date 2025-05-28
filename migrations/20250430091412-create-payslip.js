'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payslips', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'nat_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      basic_pay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      user_commision: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      user_backpay: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      user_grosspay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      user_ecocash_number: {
        type: Sequelize.STRING
      },
      tax_30_percent: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      user_netpay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      user_email_address: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      payslip_date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payslips');
  }
};