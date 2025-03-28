module.exports = (sequelize, DataTypes) => {
    const Agents = sequelize.define(
        "agent_type",
        {
            agent_type_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            agent_type: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isIn: [['LVC', 'HVC']]
                }
            }  
        },
        {
            tableName: "agent_type",
            underscored: true,
        }
    );

    return Agents;
};