module.exports = (sequelize, DataTypes) => {
  const payslip = sequelize.define(
    "payslips",
     {
      user_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      basic_pay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      user_commision: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      user_backpay: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      user_grosspay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      user_ecocash_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tax_30_percent: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      user_netpay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      user_email_address: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      payslip_date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'payslip',
      tableName: 'payslips',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['user_ecocash_number'],
        },
      ],
    }
  );

  payslip.associate = function (models) {
    payslip.belongsTo(models.users, {
      foreignKey: 'user_id',
      targetKey: 'nat_id',
      as: 'userByNatId',
    });

    payslip.belongsTo(models.users, {
      foreignKey: 'user_ecocash_number',
      targetKey: 'phone_number',
      as: 'userByPhoneNumber',
    });
  };

  return payslip;
};
  
