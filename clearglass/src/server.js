'use strict';

var configPath = `${process.env.NODE_CONFIG_DIR}` + "/" + `${process.env.NODE_ENV}` + '.json';

try {
	var config = require(configPath);
	var framework = require('./framework/index');
	framework.Config.set({
		"type": config["clearglass"]["type"],
		"env": config["env"],
		"name": config["clearglass"]["hostname"],
		"log": config["clearglass"]["log"],
		"database": config["postgres"],
		"apiRegister": config["clearglass"]["apiRegister"]
	});

	// instantiate logger
	var Log = framework.Log;
	Log.init();
	console.log("Instantiated Logger");

	//instantiate postgres
	var db = framework.Database;
	db.init();
	console.log("Instantiated Database");
	
	var Relationship = require('./relationship');
	Relationship.load(db);
	db.sequelize.sync().then(function() {
		Log.logger.info("TABLES CREATED!!");
	}).catch(function(err) {
		Log.logger.fatal("DATABASE SYNC FAILED!!", err);
		process.exit;
	});

	var Api = framework.Api;

	Api.register(framework.Config.value.apiRegister, function(err) {
		if (err) {
			Log.logger.fatal("API registration error. STOP THE PRESS!!", err);
		} else {
			Log.logger.info("API's are registered with restify!!");
		}
	});

} catch (err) {
	console.log("Could not find config: " + err);
	process.exit;
}