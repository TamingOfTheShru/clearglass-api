var bunyan = require('bunyan'),
    bformat = require('bunyan-format'),
    path = require('path'),
    debug = require('debug')('logger'),
    Config = require('./config');

//register custom errors

/**
 * Log module.
 * @module framework/Log
 */
var Log = module.exports = {
    init: init
};

Log.LOG_LEVEL = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
};

function init(config) {
    if (!config) {
        config = Config.value
    }
    var logPath,
        rootDir = path.dirname(module.parent.filename),
        formatOut = bformat({
            outputMode: 'short'
        }),
        name = config.name;

    if (config.log && config.log.path) {
        logPath = config.log.path;
    } else {
        logPath = path.resolve(rootDir, 'logs');
    }

    Log.config = {
        name: name,
        streams: [],
        serializers: bunyan.stdSerializers
    };

    if (config.log && config.log.level && Log.LOG_LEVEL[config.log.level] < Log.LOG_LEVEL.error) {
        Log.config.streams.push({
            level: config.log.level,
            path: path.resolve(logPath, name + '.log')
        });
    } else {
        Log.config.streams.push({
            level: Log.LOG_LEVEL.info,
            path: path.resolve(logPath, name + '.log')
        });
    }

    if (config.log.stdout) {
        Log.config.streams.push({
            level: Log.LOG_LEVEL.info,
            stream: process.stdout
        });
    };

    Log.config.streams.push({
        level: Log.LOG_LEVEL.error,
        path: path.resolve(logPath, name + '_error.log')
    });

    Log.config.streams.push({
        level: Log.LOG_LEVEL.fatal,
        path: path.resolve(logPath, name + '_fatal.log')
    });

    Log.logger = bunyan.createLogger(Log.config);

}

function NotImplementedError(message) {
    this.name = "NotImplementedError";
    this.message = (message || "");
}
NotImplementedError.prototype = Error.prototype;

function InvalidRequestError(message) {
    this.name = "InvalidRequestError";
    this.message = (message || "");
}

InvalidRequestError.prototype = Error.prototype;