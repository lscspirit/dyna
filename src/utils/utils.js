'use strict';

var assign     = require('object-assign');
var deferred   = require('deferred');

var ArrayUtils = require('./array_utils');
var Compare    = require('./compare');

module.exports = assign({ deferred: deferred }, ArrayUtils, Compare);