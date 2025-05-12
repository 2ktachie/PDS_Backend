'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    first_name: {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    nat_id: {
      type: DataTypes.STRING,
      unique: true
    },
    phone_number: {
      type: DataTypes.STRING,
      unique:true
    },
    department: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING,
      set(value) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(value, salt);
        this.setDataValue('password', hash);
      }
    },
    role: {
      type: DataTypes.ENUM("USER", "HR", "ADMIN"),
      defaultValue: "USER"
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    hooks: {
      beforeUpdate: (user) => {
        if (user.changed('password')) {
          const salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        }
      }
    }
  });

  // Instance method to compare passwords
  user.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  return user;
};