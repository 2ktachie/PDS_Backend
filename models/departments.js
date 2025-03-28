module.exports = (sequelize, DataTypes) => {
    const Departments = sequelize.define(
        "departments",
        {
            department_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            department: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isIn: [['111', '114']]
                }
            }  
        },
        {
            tableName: "departments",
            underscored: true,
        }
    );

    return Departments;
};