var restify = require('restify'),
    Log = require('./logger'),
    Database = require('./postgres'),
    _ = require('lodash');

/**
 * WS module.
 * @module framework/WS
 */
var WS = module.exports = {
    init: init,
    listen: listen
};

/**
 * initalise the the resity server
 * @param  {object} options - configurtion for restify
 * @return {null}
 */
function init(profile) {
    WS.port = profile.port;
    WS.server = restify.createServer({
        name: profile.name,
        log: Log.logger
    });

    WS.server.pre(restify.pre.userAgentConnection());

    /*Using default Accept Header parser.*/
    WS.server.use(restify.plugins.acceptParser(WS.server.acceptable));

    /*Using default to retrieve the user and token from Authorization header.*/
    WS.server.use(restify.plugins.authorizationParser());

    /*Default 300s clock skew.*/
    WS.server.use(restify.plugins.dateParser());
    WS.server.use(restify.plugins.queryParser());
    WS.server.use(restify.plugins.jsonBodyParser({
        mapParams: false
    }));
    //WS.server.use(config.i18n.init);

    //WS.server.use(restify.plugins.gzipResponse());
    //WS.server.use(restify.throttle(config.throttle || defaultConfig.throttle));

    //API Logs
    WS.server.on('after', function(req, res, route) {
        if (res.statusCode != 200) {
            Log.logger.error({
                res: res,
                req: req,
                error: res.error
            }, (route ? route.path : "") + " Rest API req-res ERROR");
        } else {
            Log.logger.info({
                res: res,
                req: req
            }, (route ? route.path : "") + " Rest API req-res INFO");
        }
    });

    // WS.server.get('/readiness', function(req, res, next) {
    //     var isMongoDbConnected = Database.getReadyState(),
    //         mongoDbConnectionRequired = Database.connectionRequired(),
    //         isRedisConnected = Redis.getReadyState(),
    //         redisConnectionRequired = Redis.connectionRequired();

    //     if (((isMongoDbConnected && mongoDbConnectionRequired) || (!mongoDbConnectionRequired && !isMongoDbConnected)) && ((isRedisConnected && redisConnectionRequired) || (!redisConnectionRequired && !isRedisConnected)) && ((isRabbitMQConnected && rabbitMQConnectionRequired) || (!rabbitMQConnectionRequired && !isRabbitMQConnected))) {
    //         res.send(200, {
    //             status: "UP"
    //         });
    //     } else {
    //         res.send(500, {
    //             status: "DOWN"
    //         });
    //     }
    //     next();
    // });

    // WS.server.get('/health', function(req, res, next) {
    //     res.send(200, {
    //         mongoDb: {
    //             mongoDbConnectionRequired: Database.connectionRequired(),
    //             isMongoDbConnected: Database.getReadyState()

    //         },
    //         redis: {
    //             redisConnectionRequired: Redis.connectionRequired(),
    //             isRedisConnected: Redis.getReadyState()
    //         },
    //     });
    //     next();
    // });
}

/**
 * restify server start listening
 * @return {null}
 */
function listen() {
    WS.server.listen(WS.port, function() {
        var message = 'Server ' + WS.server.name +
            ' has started to listen on port ' + WS.port;
        Log.logger.info(message);
    });
}