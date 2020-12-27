//Relationship
module.exports = { load: load };

function load(db) {
  //projects --> clients
  db.models.projects.belongsTo(db.models.clients, {
    foreignKey: "client_id",
  });
  db.models.clients.hasMany(db.models.projects, {
    foreignKey: "client_id",
  });

  //costs --> project
  db.models.costs.belongsTo(db.models.projects, {
    foreignKey: "project_id",
  });
  db.models.projects.hasMany(db.models.costs, {
    foreignKey: "project_id",
  });

  //cost_types --> costs
  db.models.costs.belongsTo(db.models.cost_types, {
    foreignKey: "cost_type_id",
  });
  db.models.cost_types.hasMany(db.models.costs, {
    foreignKey: "cost_type_id",
  });

  db.models.cost_types.hasMany(db.models.cost_types, {
    foreignKey: "parent_id",
  });
  
}
