module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define(
        "roles",
        {
            role_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isIn: [['USER', 'ADMIN']]
                }
            }  
        },
        {
            tableName: "roles",
            underscored: true,
        }
    );

    return Role;
};