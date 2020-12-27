module.exports = (sequelize, DataTypes) => {
  var CostTypes = sequelize.define(
    "cost_types",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: DataTypes.INTEGER,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      name: {
        type: DataTypes.TEXT,
        defaultValue: null,
      }
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: false,
    }
  );
  return CostTypes;
};
