'use strict';

var eventDispatcher = require('./event_dispatcher');

var Event = function(name, payload) {
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
    eventDispatcher.dispatch(this);
  };
};

//
// Exports
//

module.exports = Event;