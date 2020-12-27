var fs = require('fs'),
    _ = require('lodash'),
    async = require('async'),
    queryBuilder = require('./queryBuilder'),
    requireDir = require('require-dir'),
    path = require('path'),
    Ajv = require('ajv'),
    Promise = require('bluebird'),
    restify = require('restify'),
    errs = require('restify-errors'),
    WS = require('./restify'),
    Log = require('./logger'),
    url = require("url"),
    Util = require('./utility'),
    ApiError = require('./apiError'),
    Config = require('./config'),
    SchemaValidator = require('./schemaValidator'),
    debug = require('debug')('api-register');


var ApiRegister = module.exports = {
    register: register
}

ApiRegister.apiSchemaPath = '../schema';
ApiRegister.api = {};

/**
 * @param  {object} [options] - config for api schema path
 * @return {promise} api - SchemaStore and ProfileStore
 */
function register(options, cb) {

    if (!options) {
        options = Config.value.apiRegister
    }
    WS.init(options.serverConfig);
    WS.listen();

    ApiRegister.apiSchemaPath = options.apiSchemaPath || ApiRegister.apiSchemaPath;
    ApiRegister.prefixSchemaKey = options.prefixSchemaKey;
    ApiRegister.prefixProfileKey = options.prefixProfileKey;
    //ApiRegister.profile = options.serverConfig;
    ApiRegister.options = options;
    ApiRegister.version = options.serverConfig.version;
    ApiRegister.versionCode = options.serverConfig.versionCode;

    registerApiSchema().then(function(links) {
        var _links = {};
        _.each(ApiRegister.api.profileStore, function(item) {
            _links = item.value;
        });
        return loadProfileModule(_links);

    }).then(function(links) {

        ApiRegister.links = links;
        setApiCommonHandler();
        //postApiHandler();
        return registerApiToServer(links);

    }).then(function(links) {

        Log.logger.info('API is all set with restify');

        if (cb) {
            cb(null, links);
        }

    }).catch(function(err) {
        Log.logger.error(err);
        if (cb) {
            cb(err);
        }
    });
}

/**
 * Register API Schema and return promise with SchemaStore and ProfileStore
 * @return {promise} api - SchemaStore and ProfileStore
 */
function registerApiSchema() {
    return new Promise(function(resolve, reject) {

        var apiSchemaFiles = getAllSchemaFiles(ApiRegister.apiSchemaPath);

        Log.logger.info('Found API Schema files for \n' + apiSchemaFiles.join('\n '));

        makeApiSchemaStore(apiSchemaFiles).then(function(apiSchemaStore) {
            if (apiSchemaStore) {
                ApiRegister.api.schemaStore = apiSchemaStore;
            };

            return makeProfileLinkStore(apiSchemaStore);

        }).then(function(apiProfileStore) {
            ApiRegister.api.profileStore = apiProfileStore;
            resolve(ApiRegister.api);

        }).catch(function(err) {
            Log.logger.error(err);
            reject(err);
        });
    });
}


/**
 * validate Schema with schema version using $schema
 * @param  {string} schema - schema json
 * @param  {function} callback - Function callback with err and success
 */
function validateSchema(schema, callback) {

    var ajv = new Ajv();
    var isValid = ajv.validateSchema(schema);
    if (isValid) {
        callback(null);
    } else {
        callback(ajv.errors);
    }
}

/**
 * get the list of all the api-schema file which ends with json extension
 * @param  {string} apiSchemaPath
 * @return {array} json api-schema files
 */
function getAllSchemaFiles(apiSchemaPath) {
    var files;

    if (fs.statSync(apiSchemaPath).isDirectory()) {
        files = walk(apiSchemaPath, '.json');
    } else {
        Log.logger.error('API Schema path is not a valid directory:' + apiSchemaPath)
    }
    return files;
}


/**
 * get the list of all file which ends with extension
 * @param  {string} directory
 * @param  {string} extension
 * @return {array} array of files
 */
function walk(directory, extension) {
    var files = fs.readdirSync(directory);
    return _.chain(files)
        .map(function(f) {
            var filename = directory + '/' + f;

            if (fs.statSync(filename).isDirectory()) {
                return walk(filename);
            } else {
                return filename;
            }
        })
        .flatten()
        .filter(
            function(filename) {
                var re = new RegExp(extension, 'g');
                return filename.match(re);
            }
        ).value();
}

/**
 * make API schema store with key value of api schema
 * @param  {array} apiSchemaFiles - list of api schema file path
 * @return {promise} resolve with apikeystore
 */
function makeApiSchemaStore(apiSchemaFiles) {
    return new Promise(function(resolve, reject) {
        async.series(_.map(apiSchemaFiles, function(filename) {
            return (function(done) {
                processFile(filename, function(err, apiKeyValues) {
                    if (err) {
                        return done(err);
                    } else {
                        done(null, apiKeyValues);
                    }
                })
            });
        }), function(err, results) {
            if (err) {
                reject(err);
            } else {
                // remove all undefined item in array this is rarely happen as
                // the shall be all valid api schema else system will throw error
                // this is for dev;
                results = _.remove(results, function(item) {
                    return item;
                })
                resolve(results);
            }
        });
    });
}

/**
 * @param  {string} filename - file path of the api schema
 * @param  {function} done - for callback
 * @return {function} done - has a keyvalue of the passed file name
 */
function processFile(filename, done) {
    fs.readFile(filename, {
        encoding: 'utf8'
    }, function(err, data) {
        var schema;

        if (err) {
            throw new Error(err);
        }

        try {
            schema = JSON.parse(data);
        } catch (err) {
            Log.logger.error('API-Schema: error with schema file', filename);
            return done(err);
        }

        if (schema.ignore) {
            Log.logger.info('API-Schema: ignoring the file', filename);
            done();
        } else {
            Log.logger.info('API-Schema: processing the file', filename);
            validateSchema(schema, function(err) {
                if (err) {
                    return done(err);
                }

                if (schema["$id"]) {
                    var apiKeyValue = {};
                    apiKeyValue.key = makeKey(schema["$id"]);
                    apiKeyValue.value = schema;
                    return done(null, apiKeyValue);
                } else {
                    done();
                }
            });
        }
    });
}


/**
 * make API profile store with key value of profile and links
 * @param  {array} apiSchemaStore - key value pair for api schema
 * @return {promise} promise - apiProfileStore key value pair for profile and linkss
 */
function makeProfileLinkStore(apiSchemaStore) {
    return new Promise(function(resolve, reject) {
        var links = [];
        _.each(apiSchemaStore, function(apiSchema) {
            if (apiSchema.value.links) {
                apiSchema.value.links = _.map(apiSchema.value.links, function(link) {
                    //create regex \ pattern for href;
                    link.href_pattern = makeUrlPattern(link.href);
                    link.parameters = makeParameters(link.href);
                    link.jsonSchema = apiSchema.value["$id"];
                    return link;
                });
                links.push(apiSchema.value.links);
            }
        });
        links = _.flatten(links);
        links = _.groupBy(links, 'profile');
        var keys = Object.keys(links);
        links = _.map(keys, function(key) {
            return {
                key: ApiRegister.prefixProfileKey + ':' + key,
                value: links[key]
            }
        });
        console.log("links")
        console.log(links)
        resolve(links);
    });
}

/**
 * makeParameter gets array of string of parameters in a url
 * example /api/students/:studentId returns ['studentId']
 * @param  {stirng} resourceUrl url
 * @return {array}             array of parameters in url
 */
function makeParameters(resourceUrl) {
    var regExpIds = new RegExp('\:([a-zA-Z_]+)');
    var results = regExpIds.exec(resourceUrl);
    var params = [];

    while (results) {
        params.push(results[1]);
        resourceUrl = resourceUrl.replace(results[0], '');
        results = regExpIds.exec(resourceUrl);
    }
    return params.length === 0 ? undefined : params;
}

/**
 * makeUrlPattern makes href url lua based pattern
 * @param  {string} resourceUrl href for link
 * @return {string}             lua pattern of href for string.match
 */
function makeUrlPattern(resourceUrl) {

    var pattern;
    var regExpIds = new RegExp('\:([a-zA-Z_]+)');
    var results = regExpIds.exec(resourceUrl);
    var params = [];
    var tempUrl = resourceUrl;

    while (results) {
        params.push(results[0]);
        tempUrl = tempUrl.replace(results[0], '');
        results = regExpIds.exec(tempUrl);
    }

    //lua escape sequence for - (hyphen)
    resourceUrl = resourceUrl.replace('-', '%-');

    _.each(params, function(param) {
        resourceUrl = resourceUrl.replace(param, '([-0-9a-zA-Z%_]+)');
    })

    resourceUrl = '^' + resourceUrl + '$';

    return resourceUrl;
}


/**
 * converts schema id to key
 * example '/api-schema/master/Board.json#' to 'api-schema:master:Board'
 * @param  {string} id - for api schema
 * @return {string} key -  is identifer for json schema
 */
function makeKey(id) {
    if (id) {
        //example "id": "/api-schema/master/Board.json#",
        //remove the first char if it '/'
        id = id.replace(/^\//, '');

        //remove the .json# char if exists
        id = id.replace(/\.json\#$/, '');

        //remove the .json char if exists
        id = id.replace(/\.json$/, '');

        //debug(id);

        var key = id.split('/').join(':');
        //debug(key);
        return key;
    } else {
        throw new Error('api store key value makekey id cannot be null');
    }
}


/**
 * Loads Profile Module by reading the directory under profile
 * folder with name as profile name like /profile/master
 * @param  {string} profileName name of the profile and same directory name
 * @param  {array} links   reads controller name from the links
 * @return {promise}       returns link with dispatcher operation
 */
function loadProfileModule(links) {
    return new Promise(function(resolve, reject) {
        var profilePath = path.join(__dirname, ApiRegister.options.controllerPath);

        var error = fs.accessSync(profilePath, fs.W_OK);
        if (error) {
            Log.logger.error(error);
            return reject(error);
        }
        var controllers = requireDir(profilePath, {
            recurse: true
        });

        links = _.map(links, function(link) {
            link.dispatcherOperation = controllers[link.controller][link.operation];
            Log.logger.info('Added dispatcherOperation for', link);
            return link;
        });
        resolve(links);
    });
}


function postApiHandler() {
    WS.server.on('after', function(req, res, route, error) {
        // if (req.link && req.link.notificationId && Config.value.hosting == 'on-prem') {
        //     var message = {};
        //     message.method = req.link.method;
        //     message.href = req.route.path; //req.link.href;
        //     message.loggedInUserInfo = _.cloneDeep(req.loggedInUserInfo);
        //     message.params = _.cloneDeep(route.params);
        //     message.statusCode = res.statusCode;
        //     if (res.statusCode != 200) {
        //         message.payload = _.cloneDeep(res._body.params);
        //     } else
        //         message.payload = _.cloneDeep(res._body);

            // if (req.link.notificationId) {
            //     message.notificationId = req.link.notificationId;
            // }

            //Notification => Require the file here. and call notify function
            // var notification = require('./notification');
            // notification.notify(message)

        //}

        // POST API Handler for Subscription based api's.
        // Update subscription usage when statusCode == 200.
        // if (req.link && req.link.subscriptionFeatureId) {

        //     if (res.statusCode == 200) {
        //         var message = {},
        //             params = _.cloneDeep(req.params),
        //             routingKey = null;

        //         params["subscription_feature_id"] = req.link.subscriptionFeatureId

        //         message.payload = {
        //             "apiResponse": _.cloneDeep(res._body),
        //             "loggedInUserInfo": _.cloneDeep(req.loggedInUserInfo),
        //             "subscriptionInfo": _.cloneDeep(req.subscriptionInfo)
        //         };

        //         message.params = params

        //         if (params && params["org_id"])
        //             routingKey = "organisations." + params["org_id"] + ".projects." + params["project_id"] + ".subscription-features." + params["subscription_feature_id"] + ".update"
        //         else if (params && params["job_id"])
        //             routingKey = "jobs." + params["job_id"] + ".subscription-features." + params["subscription_feature_id"] + ".update"

        //         //publish the amqp message if routing key.
        //         if (routingKey)
        //             Amqp.publishMessage(routingKey, message);
        //         else {
        //             Log.logger.error("Subscription API not configured properly, URI should have either (org_id, project_id) or (job_id) - " + req.link.href);
        //         }
        //     }
        // }
    });
}

/**
 * setApiSecurityHandler enhance rest handler
 * Authentication and Permission security handler
 * except isPublic: true links
 * @param {array} links links for isPublic check
 */
function setApiCommonHandler() {

    WS.server.use(function(req, res, next) {
        //set version and code
        var link = _.find(ApiRegister.links, function(link) {
            link.method = link.method == 'DEL' ? 'DELETE' : link.method;
            return link.href == req.route.path && link.method.toLowerCase() == req.route.method.toLowerCase();
        });

        req.link = link;

        Log.logger.info("UnAuthenticated API call");
        return next();

        // if (!link && (req.route.path == "/health" || req.route.path == "/readiness")) {
        //     return next();
        // }

        // if api has policy, validate the policy [ "user_account" , " service_account"] 
        // else api should be public.
    //     if (req.link && !_.isEmpty(req.link.policy)) {

    //         if ((req.link.accessControl.length != 0 && !_.includes(req.link.policy, "user_account"))) {
    //             Log.logger.info("Link section of schema not properly configured.");
    //             res.send(500, {
    //                 "message": "Link section of schema not properly configured."
    //             });
    //         } else {
    //             Security.validatePolicy(req).then(function(authData) {
    //                 req.loggedInUserInfo = authData["loggedInUserInfo"];
    //                 return next();
    //             }).catch(function(err) {
    //                 if (err.statusCode) {
    //                     res.send(err.statusCode, err["error"]);
    //                 } else {
    //                     res.send(500, "Handle the status code in policy" + err.statusCode)
    //                 }
    //             })
    //         }

    //     } else if (req.link && req.link.isPublic) {
    //         Log.logger.info("UnAuthenticated API call");
    //         return next()
    //     } else {
    //         Log.logger.info("Link section of schema not properly configured.");
    //         res.send(500, {
    //             "message": "Link section of schema not properly configured."
    //         });
    //         return next();
    //     }
    });
}

/**
 * Registers API to restify server with all the links
 * @param  {array} links array of links with dispatcherOpreation function reference
 * @return {Promise}       TODO
 */
function registerApiToServer(links) {
    return new Promise(function(resolve, reject) {
        _.each(links, function(link) {
            var options = {
                url: link.href
            };
            //restify treates DELETE as del method
            link.method = link.method == 'DELETE' ? 'DEL' : link.method;

            if (link.contentType == 'multipart') {
                WS.server[link.method.toLowerCase()].call(WS.server, options, restify.plugins.bodyParser(), function(req, res, next) {
                    setHandler(link, req, res, next);
                });
            } else {
                WS.server[link.method.toLowerCase()].call(WS.server, options, function(req, res, next) {
                    setHandler(link, req, res, next);
                });
            }

            Log.logger.info('Registered API link', link);
        });
        resolve();
    });
}


function setHandler(link, req, res, next) {
    var operationParameters = makeOperationParameters(link, req, res, next);

    //if operation Parameter is error then throw 400 Bad request
    if (operationParameters instanceof Error) {
        res.send(400, operationParameters);
        return next();
    }

    //operationParameters will have order in params, query, body and finally [options]
    link.dispatcherOperation.apply(link.dispatcherOperation, operationParameters)
        .then(function(data) {

            if (link.responseType == 'text/html') {

                res.writeHead(200, {
                    //'Content-Length': Buffer.byteLength(data.body),
                    'Content-Type': 'text/html'
                });
                res.write(data.body);
                res.end();

            } else if (link.responseType == 'redirect') {

                res.redirect(data.url, next);

            } else if (link.responseType == 'octet/stream') {
                res.set("Content-Type", 'application/octet-stream');
                if (data && data.fileName) {
                    res.setHeader("Content-disposition", "attachment; filename=" + data.fileName);
                }
                if (data && data.dataStream) {
                    data["dataStream"].pipe(res)
                }

            } else if (link.responseType == 'image/*') {
                res.set("Content-Type", 'image/*');
                if (data && data.fileName) {
                    res.setHeader("Content-disposition", "attachment; filename=" + data.fileName);
                }
                if (data && data.data) {
                    res.send(200, data.data);
                }
            } else if (link.responseType == 'text/csv') {

                res.set("Content-Type", "text/csv");
                res.setHeader("Content-disposition", "attachment; filename=" + data.fileName + ".csv");
                res.send(200, data.data);

            } else if (link.responseType == 'text/plain') {

                res.set("Content-Type", "text/plain");
                res.setHeader("Content-disposition", "attachment; filename=" + data.fileName + ".txt");
                res.send(200, data.data);

            } else {

                if (data) {
                    res.send(200, data);
                } else {
                    res.send(404, new Error('RECORD_NOT_FOUND'));
                }
            }
            return next();
        }).catch(function(err) {

            res.error = {
                'message': err.message,
                'stack': err.stack
            };


            var message = {
                req: {
                    'method': req.method,
                    'url': req.url,
                    'headers': req.headers
                },
                error: res.error
            };
            //publish the message
            //amqpClient.publishError(message);

            ApiError.getHttpError("en", err, function(err, httpError) {

                if (err) {
                    res.send(500, httpError);
                    return next();
                } else {
                    if (httpError.statusCode == 500)
                        res.send(500, new errs.InternalServerError(httpError.error));
                    else
                        res.send(httpError.statusCode, httpError.error);
                    return next();
                }
            });
        });
}


/**
 * makeOperationParameters  makes operation parameter array in order of
 * url param value, req.query object, req.body object, userInfo
 * and then opts with req,res and next function.
 * example: /api/boards/:boardId
 * url /api/boards/1?description=cbse
 * req.params = {boardId: '1', description: 'cbse'}
 * req.query = {description: 'cbse'}
 * so make params = ['1', {description: 'cbse'}]
 * needs unit test
 * @param  {object}   link   link section of api-schema
 * @param  {function}   req  restify req function
 * @param  {function}   res  restify res function
 * @param  {function} next resity next function
 * @return {array}        operation parameter in an order
 */
function makeOperationParameters(link, req, res, next) {
    var params = [],
        opt = {};
    opt.req = req;
    opt.res = res;
    opt.next = next;

    //if parameters is there in link section then req.params is manadatory
    if (link.parameters) {
        if (!_.isEmpty(req.params)) {
            params = _.values(_.omit(req.params, _.keys(req.query)));

            if (link.contentType == "multipart") {
                params = _.values(_.omit(req.params, _.keys(req.body)));
            }

            // Remove subscriptionFeatureId from params
            // if (req["params"] && req["params"]["subscriptionFeatureId"]) {
            //     _.remove(params, function(p) {
            //         return p == req["params"]["subscriptionFeatureId"];
            //     });
            // }

            //below is no more required as we are setting this in restify.js in jsonbodyparser

        } else {
            return Error('BAD-REQUEST: url-parameter missing');
        }
    };

    //add query string object to parameter is there is qsp
    var query = makeDBQuery(link.filter, req);
    if (query) {
        if (params) {
            params.push(query);
        } else {
            params = query;
        }
    };

    //pass body json if POST and PUT
    if (link.method == 'POST' || link.method == 'PUT') {

        //validate the payload json with JsonSchema
        var error = SchemaValidator.validate(link.jsonSchema, req.body);

        if (error) {
            return ApiError.BadRequest('BAD-REQUEST: ' + error);
        }

        if (params) {
            params.push(req.body);
        } else {
            params = req.body;
        }
    };
    //get the user info if this is user based policy
    if (req.loggedInUserInfo) {
        //userInfo
        if (params) {
            params.push(req.loggedInUserInfo);
        } else {
            params = req.loggedInUserInfo;
        }
    }

    //add req, res , next for custom usage
    if (params) {
        params.push(opt);
    } else {
        params = opt;
    }
    return params;
}

function makeDBQuery(filter, req) {

    if (!filter) {
        return;
    }

    var urlParts = url.parse(req.url, true);

    var query = queryBuilder.buildQuery(urlParts.query);

    if (filter.type == 'custom') {
        return query;
    } else if (filter.type == 'db') {
        var dbQuery;

        if (filter && query) {
            dbQuery = {};
            if (query.pageNumber && query.pageCount) {
                dbQuery.paging = {
                    pageNumber: _.parseInt(query.pageNumber),
                    pageCount: _.parseInt(query.pageCount)
                };
            }

            dbQuery.filter = {};
            _.forEach(query.search, function(item) {

                //check if the qsp config is there in api-schema
                var qsp = _.find(filter.parameters, {
                    'name': item.searchProperty
                });
                //make mongodb query
                if (qsp) {

                    //change to MongoDB datatype
                    switch (qsp.propertyDateType) {
                        case 'Epoch':
                            item.searchValue = stringToDate(item.searchValue);
                            break;
                        case 'Boolean':
                            item.searchValue = stringToBoolean(item.searchValue);
                            break;
                    }

                    switch (item.searchOperator) {

                        case 'like':
                            dbQuery.filter[qsp.dbPropertyName] = {
                                '$regex': item.searchValue,
                                $options: "i"
                            };
                            break;
                        case 'eq':
                            dbQuery.filter[qsp.dbPropertyName] = {
                                '$eq': item.searchValue
                            };
                            break;
                        case 'in':
                            dbQuery.filter[qsp.dbPropertyName] = {
                                '$in': item.searchValue.split(",")
                            };
                            break;
                        case 'nin':
                            dbQuery.filter[qsp.dbPropertyName] = {
                                '$nin': item.searchValue.split(",")
                            };
                            break;
                        case 'lt':
                            if (dbQuery.filter[qsp.dbPropertyName]) {
                                dbQuery.filter[qsp.dbPropertyName]['$lt'] = item.searchValue;
                            } else {
                                dbQuery.filter[qsp.dbPropertyName] = {
                                    '$lt': item.searchValue
                                }
                            }
                            break;
                        case 'gt':
                            if (dbQuery.filter[qsp.dbPropertyName]) {
                                dbQuery.filter[qsp.dbPropertyName]['$gt'] = item.searchValue;
                            } else {
                                dbQuery.filter[qsp.dbPropertyName] = {
                                    '$gt': item.searchValue
                                }
                            }
                            break;

                        case 'ge':
                            if (dbQuery.filter[qsp.dbPropertyName]) {
                                dbQuery.filter[qsp.dbPropertyName]['$gte'] = item.searchValue;
                            } else {
                                dbQuery.filter[qsp.dbPropertyName] = {
                                    '$gte': item.searchValue
                                }
                            }
                            break;
                        case 'le':
                            if (dbQuery.filter[qsp.dbPropertyName]) {
                                dbQuery.filter[qsp.dbPropertyName]['$lte'] = item.searchValue;
                            } else {
                                dbQuery.filter[qsp.dbPropertyName] = {
                                    '$lte': item.searchValue
                                }
                            }
                            break;
                    }
                };
            });
        }

        return dbQuery;
    }
}