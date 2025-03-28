module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define(
        "employees",
        {
            employee_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            agent_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            agent_type_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "agent_type",
                    key: "agent_type_id",
                    onDelete: "RESTRICT",
                    onUpdate: "CASCADE"
                }
            },
            department_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "departments",
                    key: "department_id",
                    onDelete: "RESTRICT",
                    onUpdate: "CASCADE"
                }
            },
            image_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            }
        },
        {
            tableName: "employees",
            underscored: true,
        }
    );
    
    Employee.associate = function(models) {
        Employee.belongsTo(models.departments, {
            foreignKey: 'department_id',
            as: 'department'
        });
        
        Employee.belongsTo(models.agent_type, {
            foreignKey: 'agent_type_id',
            as: 'agent_type'
        });
        
        Employee.hasMany(models.calls, {
            foreignKey: 'employee_id',
            as: 'calls'
        });
    };
    
    return Employee;
};