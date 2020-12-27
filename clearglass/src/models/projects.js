module.exports = (sequelize, DataTypes) => {
  var Projects = sequelize.define(
    "projects",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      title: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      client_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      }
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: false,
    }
  );
  return Projects;
};
