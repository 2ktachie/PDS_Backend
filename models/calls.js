module.exports = (sequelize, DataTypes) => {
    const Calls = sequelize.define(
        "calls",
        {
            call_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            report_time: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            employee_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "employees",
                    key: "employee_id",
                    onDelete: "RESTRICT",
                    onUpdate: "CASCADE"
                }
            },
            total_inbound_calls: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            total_outbound_calls: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            upload_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "file_uploads",
                    key: "upload_id",
                    onDelete: "SET NULL",
                    onUpdate: "CASCADE"
                }
            }
        },
        {
            tableName: "calls",
            underscored: true,
        }
    );
    
    Calls.associate = function(models) {
        Calls.belongsTo(models.employees, {
            foreignKey: 'employee_id',
            as: 'employee'
        });
        
        Calls.belongsTo(models.file_uploads, {
            foreignKey: 'upload_id',
            as: 'upload'
        });
    };
    
    return Calls;
};