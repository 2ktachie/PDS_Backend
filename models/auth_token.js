module.exports = (sequelize, DataTypes) => {
    const AuthToken = sequelize.define(
      "auth_tokens",
      {
        token_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          unique: true,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "user_id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
          }
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        token_type: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [['ACCESS', 'REFRESH', 'VERIFICATION', 'PASSWORD_RESET']]
          }
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        is_revoked: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        device_info: {
          type: DataTypes.TEXT,
          allowNull: true,
        }
      },
      {
        tableName: "auth_tokens",
        underscored: true,
        indexes: [
          {
            unique: false,
            fields: ['user_id']
          },
          {
            unique: false,
            fields: ['token_type']
          }
        ]
      }
    );
  
    AuthToken.associate = function(models) {
      AuthToken.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user'
      });
    };
  
    return AuthToken;
  };
  