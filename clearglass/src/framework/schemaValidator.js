var Ajv = require('ajv'),
	_ = require('lodash'),
	ajv,
	fs = require('fs'),
	debug = require('debug')('schema-validator');
/**
 * SchemaValidator module.
 * @module framework/schemaValidator
 */
var schemaValidator = module.exports = {
	validate: validate,
	ajv: ajv
}

ajv = Ajv({
	allErrors: true,
	missingRefs: 'ignore',
	extendRefs: 'ignore' //ignore refs while compliation
});


/**
 * validate - validates the data object against the schema defined
 * @param  {string} link         schema
 * @param  {object} data         Client object
 * @return {string}  string of error
 */
function validate(link, data) {

	var schema = ajv.getSchema(link);

	if (_.isEmpty(data))
		return;

	if (!schema) {
		var schema = fs.readFileSync(link);
		ajv.addSchema(JSON.parse(schema.toString()), link);
	}

	var valid = ajv.validate(link, data);

	if (!valid) {
		return ajv.errorsText(valid.errors);
	}
}