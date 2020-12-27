var Sequelize = require("sequelize"),
  debug = require("debug")("postgres"),
  uuidv1 = require("uuid/v1"),
  fs = require("fs"),
  path = require("path"),
  Log = require("./logger"),
  Config = require("./config"),
  _ = require("lodash"),
  Promise = require('bluebird'),
  models = {};

/**
 * api module.
 * @module framework/Redis
 */
var Postgres = (module.exports = {
  init: init,
  makeSequelizeQSP: makeSequelizeQSP,
  Sequelize: Sequelize,
  models: models,
});

/**
 * Init the redis server and start running
 * @param  {object} config for redis server
 * @return {null}
 */
function init(config) {
  if (!config) {
    config = Config.value.database;
  }
  Postgres.sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
  // Postgres.sequelize
  //   .authenticate()
  //   .then(() => {
  //     console.log('Connection has been established successfully.');
  //     return dumpData(config);
  //   }).catch(err => {
  //     console.error('Unable to connect to the database:', err);
  //   });

  loadModels(config.modelPath);
}


function dumpData(config) {
  return new Promise(function(resolve, reject) {
    var mysqlDumpFile = path.join(__dirname, config.dumpPath);
    console.log("Importing from " + mysqlDumpFile + "...");
    let queries = fs.readFileSync(mysqlDumpFile, {
      encoding: "UTF-8"
    }).split(";\n");

    console.log("Importing dump file...");

    // Setup the DB to import data in bulk.
    // let promise = Postgres.sequelize.query("set FOREIGN_KEY_CHECKS=0").then(() => {

    //   return Postgres.sequelize.query("set UNIQUE_CHECKS=0");
    // }).then(() => {
    //   return Postgres.sequelize.query("set SQL_MODE='NO_AUTO_VALUE_ON_ZERO'");
    // }).then(() => {
    //   return Postgres.sequelize.query("set SQL_NOTES=0");
    // });
    //var promise = [];
    
    console.time("Importing mysql dump");
    for (let query of queries) {
      query = query.trim();
      if (query.length !== 0 && !query.match(/\/\*/)) {
        promise = promise.then(() => {
        console.log("Executing: " + query.substring(0, 100));
        // promise.push(Postgres.sequelize.query(query, {
        //   raw: true
        // }));
        });
      }
    }
    // Promise.all(promise).then(function() {
    //   console.log("Done")
    // });
    // Run the rest of your migrations
    // exports.migrateUp(config.database).then(() => {
    //   console.timeEnd("Migrating after importing mysql dump");
    // });
  });
}

function loadModels(modelPath) {
  //__dirname: app/api/src/framework
  const absoluteModelFilePath = path.join(__dirname, modelPath);

  fs.readdirSync(absoluteModelFilePath)
    .filter((file) => file.indexOf(".") !== 0 && file.slice(-3) === ".js")
    .forEach((file) => {
      const model = Postgres.sequelize.import(
        path.join(absoluteModelFilePath, file)
      );
      models[model.name] = model;
    });

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
}

function makeSequelizeQSP(qsp) {
  var sequelizeQuery = {};
  if (_.isEmpty(qsp)) return sequelizeQuery;

  const sequelizeOps = (searchOperator, searchValue) => {
    switch (searchOperator) {
      case "like":
        return {
          [Postgres.Sequelize.Op.iLike]: `%${searchValue}%`
        };
      case "eq":
        return {
          [Postgres.Sequelize.Op.eq]: searchValue
        };
      default:
        break;
    }
  };

  _.forEach(qsp.search, (search) => {
    sequelizeQuery[search.searchProperty] = sequelizeOps(
      search.searchOperator,
      search.searchValue
    );
  });

  return sequelizeQuery;
}
