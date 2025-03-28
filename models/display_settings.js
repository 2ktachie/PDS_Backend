module.exports = (sequelize, DataTypes) => {
    const DisplaySettings = sequelize.define(
        "display_settings",
        {
            setting_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            setting_name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            display_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            setting_value: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            setting_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['string', 'number', 'boolean', 'json']]
                }
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            updated_by: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                    onDelete: "RESTRICT",
                    onUpdate: "CASCADE"
                }
            }
        },
        {
            tableName: "display_settings",
            underscored: true,
        }
    );
    
    DisplaySettings.associate = function(models) {
        DisplaySettings.belongsTo(models.Users, {
            foreignKey: 'updated_by',
            as: 'last_updated_by'
        });
    };
    
    return DisplaySettings;
};
