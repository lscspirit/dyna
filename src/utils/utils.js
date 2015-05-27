'use strict';

var assign     = require('object-assign');

var ArrayUtils = require('./array_utils');
var Compare    = require('./compare');

module.exports = assign({ assign: assign }, ArrayUtils, Compare);