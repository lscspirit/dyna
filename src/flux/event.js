'use strict';

var str     = require('underscore.string');
var assign  = require('object-assign');
var compare = require('../utils/compare');

/**
 * Event object to be sent through the EventDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Event = function(name, payload) {
  var _name    = name || '*';
  var _payload = payload;

  /**
   * Return the name of the Event
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Event
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Event through a EventDispatcher
   * @param {EventDispatcher} event_dispatcher - dispatcher through which the Event is dispatched
   * @throws {Error} if event_dispatcher is undefined or invalid
   */
  this.dispatch = function(event_dispatcher) {
    if (compare.isUndefined(event_dispatcher)) throw new Error('event_dispatcher is undefined. Please provide a valid EventDispatcher instance.');
    if (!compare.isFunction(event_dispatcher.dispatch)) throw new Error('Invalid EventDispatcher. EventDispatcher must have a dispatch() method.');
    event_dispatcher.dispatch(this);
  };
};

/**
 * Create a event creator
 *
 * @param {string} namespace - a namespace string to distinguish this creator from others
 * @param {Object.<string,function>} events - a map of event to payload function that converts arguments to payload object
 *
 * @example
 * var chat_event_creator = dyna.createEventCreator('chat', {
 *   messageReceived: function(new_message) { return { message: new_message }; }
 * });
*
 * // Coordinator
 * var ChatRoom = function() {
 *   // ...
 *
 *   function _newMessageReceived(message) {
 *     chat_event_creator.instance(this.flux).messageReceived(message);
 *   }
 * }
 *
 * // In Store
 * var ChatMessageStore = {
 *   $processEvent : function(event) {
 *     if (event.name() == chat_event_creator.EVENTS.MESSAGE_RECEIVED) {
 *       this.receivedMessage(event.payload());
 *     }
 *   }
 * }
 */
function createEventCreator(namespace, events) {
  if (!compare.isString(namespace) || namespace.length == 0) throw new Error('namespace must not be an empty string');
  if (!compare.isObject(events)) throw new Error('events must be a plain javascript object');

  var self = this;

  // event functions
  var _events = {};
  // event name constants
  var _event_names = {};

  // creates the event dispatch function
  for (var key in events) {
    var name = str(key).underscored().toUpperCase().value();
    var payloadFn = events[key];

    var ns_name = namespace + "." + key;
    _event_names[name] = ns_name;

    _events[key] = function(evt_name, fn) {
      return function() {
        var payload = compare.isFunction(fn) ? fn.apply(null, arguments) : null;
        return (new Event(evt_name, payload)).dispatch(this._flux.event_dispatcher);
      };
    }(ns_name, payloadFn);
  }

  return {
    EVENTS: _event_names,
    instance: function(flux) {
      return assign({ _flux: flux }, _events);
    }
  };
}

/**
 * @deprecated since 0.1.4; use event creator instead
 *
 * Create a factory object that can build Event according to the <tt>event_specs</tt>
 * @param {Object.<string, string>}   event_names - event name constants
 * @param {Object.<string, function>} event_specs - event specifications
 * @returns {EventFactory} the factory object
 *
 * @example
 * var names  = {
 *   STATUS_CHANGE: 'buzzer.status-change',
 *   SNOOZED      : 'buzzer.snoozed'
 * };
 * var event_factory = dyna.createEventFactory(names, {
 *   statusChange : function(status) {
 *     return this.createEvent(this.EVENTS.STATUS_CHANGE, status);
 *   },
 *   snoozed : function() {
 *     return this.createEvent(this.EVENTS.SNOOZED);
 *   }
 * });
 *
 * // event_factory.EVENTS.STATUS_CHANGE;   => 'buzzer.status-change'
 *
 * // Coordinator
 * var Buzzer = function() {
 *   // ...
 *
 *   function _buzzStatusChange(status) {
 *     event_factory.statusChange(status).dispatch(this.flux.event_dispatcher);
 *   }
 * }
 */
function createEventFactory(event_names, event_specs) {
  /**
   * Factory class for creating Events.
   * @constructor
   */
  var EventFactory = function() {
    this.EVENTS = assign({}, event_names);

    /**
     * Create a new Event object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Event
     * @returns {Event} - the event object @see {@link Event}
     */
    this.createEvent = function(name, payload) {
      return new Event(name, payload);
    };
  };

  EventFactory.prototype = Object.create(event_specs);
  EventFactory.prototype.constructor = EventFactory;

  return new EventFactory();
}

//
// Exports
//

module.exports = {
  createEventFactory: createEventFactory,
  createEventCreator: createEventCreator
};