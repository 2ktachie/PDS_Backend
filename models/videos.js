module.exports = (sequelize, DataTypes) => {
    const Video = sequelize.define(
        "videos",
        {
            video_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            file_path: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            file_size: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            duration: {
                type: DataTypes.INTEGER, // Duration in seconds
                allowNull: true,
            },
            mime_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            uploaded_by: {
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
            tableName: "videos",
            underscored: true,
        }
    );
    
    Video.associate = function(models) {
        Video.belongsTo(models.Users, {
            foreignKey: 'uploaded_by',
            as: 'uploader'
        });
    };
    
    return Video;
};
