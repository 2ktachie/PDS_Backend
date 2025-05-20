module.exports = (sequelize, DataTypes) => {
  const liquidpayslip = sequelize.define(
    'LiquidPayslips', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_name: {
        type: DataTypes.STRING
      },
      user_surname: {
        type: DataTypes.STRING
      },
      user_total_earnings_usd: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_netpay_usd: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_deductions_usd: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_tax_zig_usd: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_commision_usd: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_basic_salary_usd: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_total_earnings_zig: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_deductions_zig: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_tax_zig: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_netpay_zig: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_commision_zig: {
        type: DataTypes.DECIMAL(10, 2)
      },
      user_basic_salary_zig: {
        type: DataTypes.DECIMAL(10, 2)
      },
      current_date: {
        type: DataTypes.DATEONLY
      },
      currency: {
        type: DataTypes.STRING
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

    return liquidpayslip;
  };

  
