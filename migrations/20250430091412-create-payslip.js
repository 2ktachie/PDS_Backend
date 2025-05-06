'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('payslips', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      Period: {
        type: DataTypes.STRING
      },
      Nat_ID: {
        type: DataTypes.STRING
      },
      Pay_Method: {
        type: DataTypes.STRING
      },
      Pay_Point: {
        type: DataTypes.STRING
      },
      Cost_Centre: {
        type: DataTypes.STRING
      },
      Int_Grade: {
        type: DataTypes.STRING
      },
      Department: {
        type: DataTypes.STRING
      },
      SSN: {
        type: DataTypes.STRING
      },
      NEC_Grade: {
        type: DataTypes.STRING
      },
      Pay_Rate: {
        type: DataTypes.DOUBLE
      },
      Pay_Method: {
        type: DataTypes.STRING
      },
      Position: {
        type: DataTypes.STRING
      },
      Leave_Bal: {
        type: DataTypes.FLOAT
      },
      Loan_Balance: {
        type: DataTypes.DOUBLE
      },
      Bank: {
        type: DataTypes.STRING
      },
      Acc_No: {
        type: DataTypes.FLOAT
      },
      Date_Engaged: {
        type: DataTypes.DATE
      },
      Pay_day: {
        type: DataTypes.DATE
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payslips');
  }
};