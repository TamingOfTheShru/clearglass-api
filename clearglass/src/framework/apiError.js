var errorFactory = require('error-factory');

/**
 * ApiError module.
 * @module framework/ApiError
 */
var ApiError = module.exports = {
	BadRequest: errorFactory('BadRequest', ['message', 'code', 'context']),
	Unauthorized: errorFactory('Unauthorized', ['message', 'code', 'context']),
	PaymentRequired: errorFactory('PaymentRequired', ['message', 'code', 'context']),
	Forbidden: errorFactory('Forbidden', ['message', 'code', 'context']),
	NotFound: errorFactory('NotFound', ['message', 'code', 'context']),
	Conflict: errorFactory('Conflict', ['message', 'code', 'context']),
	ResetContent: errorFactory('ResetContent', ['message', 'code', 'params', 'context']),
	getHttpError: getHttpError
}


function getHttpError(language, err, cb) {

	var httpError = {
		'statusCode': 500,
		'error': err
	}
	//later en can be replaced with user session language preference
	var resourcekey = "api:" + language;

	if (err instanceof ApiError.BadRequest) {
		httpError.statusCode = 400;
	} else if (err instanceof ApiError.Unauthorized) {
		httpError.statusCode = 401;
	} else if (err instanceof ApiError.PaymentRequired) {
		httpError.statusCode = 402;
	} else if (err instanceof ApiError.Forbidden) {
		httpError.statusCode = 403;
	} else if (err instanceof ApiError.NotFound) {
		httpError.statusCode = 404;
	} else if (err instanceof ApiError.Conflict) {
		httpError.statusCode = 409;
	} else if (err instanceof ApiError.ResetContent) {
		httpError.statusCode = 417;
	} else if (err instanceof Object && err.statusCode) {
		httpError.statusCode = err.statusCode
	}
	httpError.error = err;
	cb(null, httpError);
	// getErrorResourceMessage(resourcekey, err, function(err, error) {
	// 	if (err) {
	// 		cb(err);
	// 	} else {
	// 		httpError.error = error.errorObject ? error.errorObject : error;
	// 		cb(null, httpError);
	// 	}
	// });
}