var fs = require('fs'),
    _ = require('lodash');

/**
 * Util module.
 * @module framework/Util
 */
var Util = module.exports = {
    slugify: slugify,
    walk: walk,
    isUniqueCollection: isUniqueCollection,
    containsCollection: containsCollection,
    emailregEx: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
};

/**
 * To generate human-readable url slugs from any ordinary string,
 * you can use the following code snippet in your javascript.
 *
 * converts Computer Science --> computer-science
 *
 * @param  {[type]} text string that needs to be slugified
 * @return {[type]}      slugified string
 */
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

function walk(root, includeRegex, excludeRegex, removePath) {
    var output = [];
    var directories = [];

    // First read through files 
    fs.readdirSync(root).forEach(function(file) {
        var newPath = root + '/' + file;
        var stat = fs.statSync(newPath);

        if (stat.isFile()) {
            if (includeRegex.test(file) && (!excludeRegex || !excludeRegex.test(file))) {
                output.push(newPath.replace(removePath, ''));
            }
        } else if (stat.isDirectory()) {
            directories.push(newPath);
        }
    });

    // Then recursively add directories
    directories.forEach(function(directory) {
        output = output.concat(_walk(directory, includeRegex, excludeRegex, removePath));
    });

    return output;
};

/**
 * isUniqueCollection - checj if collection is unique
 * @param  {array of objects}  collection of objects
 * @param  {string}  property   property in collection that needs to checked for uniqueness
 * @return {Boolean}            true is unique \ else false for not unique
 */
function isUniqueCollection(collection, property) {
    var isUnique = true;

    if (!collection) return isUnique;

    var uniqueLength = _.uniqBy(collection, property).length;
    var collectionLength = collection.length;

    if (uniqueLength != collectionLength) isUnique = false;
    return isUnique;
}

/**
 * containsCollection checks if collection1 contains collection2 with properties
 * @param  {array of object} collection1 child collection
 * @param  {string} property1   json path \ property path of json object
 * @param  {array of object} collection2 parent collection
 * @param  {string} property2   json path \ property path of json object
 * @return {boolean}             true if collection1 is in collection2
 */
function containsCollection(collection1, property1, collection2, property2) {
    var contains = false;

    if ((!collection1) || (!collection1 && !collection2)) {
        contains = true;
    }

    if (collection1 && !collection2) {
        contains = false;
    };

    if (collection1 && collection2) {
        _.forEach(collection1, function(item1) {
            var value1 = getValue(property1, item1);
            contains = false;
            _.forEach(collection2, function(item2) {
                var value2 = getValue(property2, item2);
                if (value1 == value2) {
                    contains = true;
                };
            });
            if (!contains) return contains;
        });
    };
    return contains;
}


function getValue(path, obj) {
    var fields = path.split('.');
    var result = obj;
    for (var i = 0, n = fields.length; i < n && result !== undefined; i++) {
        var field = fields[i];
        if (i === n - 1) {
            return result[field];
        } else {
            result = result[field];
        }
    }
}