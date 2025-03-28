module.exports = (sequelize, DataTypes) => {
    const AuditTrail = sequelize.define(
        "audit_trail",
        {
            trail_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                    onDelete: "RESTRICT",
                    onUpdate: "CASCADE"
                }
            },
            action: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            }
        },
        {
            tableName: "audit_trail",
            underscored: true,
        }
    );
    
    AuditTrail.associate = function(models) {
        AuditTrail.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };
    
    return AuditTrail;
};