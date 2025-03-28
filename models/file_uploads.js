module.exports = (sequelize, DataTypes) => {
  const FileUploads = sequelize.define(
    "file_uploads",
    {
      upload_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true,
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      upload_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING",
        validate: {
          isIn: [["PENDING", "PROCESSED", "CANCELLED"]]
        }
      },
      record_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      tableName: "file_uploads",
      underscored: true,
    }
  );

  FileUploads.associate = function(models) {
    FileUploads.belongsTo(models.Users, {
      foreignKey: 'uploaded_by',
      as: 'uploader'
    });
  };

  return FileUploads;
}; 