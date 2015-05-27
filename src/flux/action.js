'use strict';

var actionDispatcher = require('./action_dispatcher');

var Action = function(name, payload) {
  var _name    = name;
  var _payload = payload;
  var _context = undefined;

  this.name = function() {
    return _name;
  };

  this.setContext = function(context) {
    _context = context;
  };

  this.context = function() {
    return _context;
  };

  this.payload = function() {
    return _payload;
  };

  this.dispatch = function() {
    actionDispatcher.emit(this.name(), this);
  };
};

//
// Exports
//

module.exports = Action;