var Promise = require("bluebird"),
  uuidv1 = require("uuid/v1"),
  _ = require("lodash"),
  framework = require("../framework/index"),
  apiError = framework.ApiError,
  db = framework.Database;

/**
 * CostController module.
 * @module controller/CostController
 */
var CostController = (module.exports = {
  getCostData: getCostData
})

/**
 * getCostData - gets cost data of all the clients and their projects by qsp
 * @return {promise} array containing cost data of all customer
 */
function getCostData(qsp, opts) {
  return new Promise(function(resolve, reject) {

    var whereClause = {};
    // const sequelizeQSP = db.makeSequelizeQSP(qsp);
    // console.log(sequelizeQSP);
    // var q = sequelizeQSP["client_id"];

    if (!_.isEmpty(qsp)) {
      var q = []
      _.each(qsp.search, function(a) {
        q.push(parseInt(a.searchValue))
      });
      whereClause = {
        id: q
      }
      console.log(whereClause);
      if (qsp.search[0].searchProperty == "client_id") {
        return resolve(getCostsByClient(whereClause));
      }

      if (qsp.search[0].searchProperty == "cost_type_id") {
        return resolve(getCostsByCostType(whereClause));
      }

      if (qsp.search[0].searchProperty == "project_id") {
        return resolve(getCostsByProject(whereClause));
      }
    }

    db.models.clients
      .findAll({
        include: [{
          model: db.models.projects,
          include: [{
            model: db.models.costs,
            include: [{
              model: db.models.cost_types,
            }],
          }],
        }, ],
      })
      .then((_clientCosts) => {

        var clientCosts = _.cloneDeep(_clientCosts)

        return resolve(clientCosts);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

/**
 * getCostsByProject - gets cost by Project
 * @param  {object} whereClause whereClause containing project_id qsp
 * @return {promise} 
 */
function getCostsByProject(whereClause) {
  return new Promise(function(resolve, reject) {
    db.models.clients
      .findAll({
        include: [{
          model: db.models.projects,
          where: whereClause,
          include: [{
            model: db.models.costs,
            include: [{
              model: db.models.cost_types,
            }],
          }],
        }, ],
      })
      .then((_clientCosts) => {
        var clientCosts = _.cloneDeep(_clientCosts)
        return resolve(clientCosts);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

/**
 * getCostsByCostType - gets cost by costType
 * @param  {object} whereClause whereClause containing cost_type qsp
 * @return {promise} 
 */
function getCostsByCostType(whereClause) {
  return new Promise(function(resolve, reject) {
    db.models.clients
      .findAll({
        include: [{
          model: db.models.projects,
          include: [{
            model: db.models.costs,
            include: [{
              model: db.models.cost_types,
              where: whereClause,
            }],
          }],
        }, ],
      })
      .then((_clientCosts) => {
        var clientCosts = _.cloneDeep(_clientCosts)
        return resolve(clientCosts);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}


/**
 * getCostsByClient - gets cost by clients
 * @param  {object} whereClause whereClause containing client qsp
 * @return {promise} 
 */
function getCostsByClient(whereClause) {
  return new Promise(function(resolve, reject) {
    db.models.clients
      .findAll({
        where: whereClause,
        include: [{
          model: db.models.projects,
          include: [{
            model: db.models.costs,
            include: [{
              model: db.models.cost_types,
            }],
          }],
        }, ],
      })
      .then((_clientCosts) => {
        var clientCosts = _.cloneDeep(_clientCosts)
        return resolve(clientCosts);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}



// var res = [];
// res = _.map(clientCosts, function(clientCost) {
//   _.map(clientCost["projects"], function(projectCost) {
//     _.map(projectCost["costs"], function(cost) {
//       //_.each(cost, function(c){
//         projectCost["amount"] = _.sumBy(cost, function(c) { return c.amount; });
//         console.log(projectCost)
//       //})
//     });
//   })
// });


// var projectCost = 0, clientCost = 0;
// _.each(clientCosts, function(clientCost) {
//   _.each(clientCost["projects"], function(project) {
//     project["amount"] = _.sumBy(project["costs"], 'amount');
//     // project["amount"] = projectCost
//     //console.log(project)
//   });
// });