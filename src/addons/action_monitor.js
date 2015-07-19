'use strict';

var assign  = require('object-assign');
var compare = require('../utils/compare');

var createEventFactory = require('../flux/event').createEventFactory;
var registerStore      = require('../flux/stores').registerStore;

var ACTION_MONITOR_EVENT_NAME = 'action-monitor.status-change';
var ACTION_MONITOR_STORE_NAME = '$ActionMonitorStore';

var EventFactory = createEventFactory({ CHANGE: ACTION_MONITOR_EVENT_NAME }, {
  actionStateChange : function(payload) {
    return this.createEvent(this.EVENTS.CHANGE, payload);
  }
});

/**
 * An object that represents an Action status
 * @param {number} action_id - action id
 * @param {string} state     - action state ('tracking', 'resolved', 'rejected')
 * @param {*}      [data]    - action data
 * @constructor
 */
var ActionStatus = function(action_id, state, data) {
  //
  // Accessors
  //

  /**
   * Action Id
   * @returns {number} action id
   */
  this.actionId = function() {
    return action_id;
  };

  /**
   * Extra data (or error if the action was rejected) associated with this action
   * @returns {*} any data
   */
  this.data = function() {
    return data;
  };

  /**
   * Current state of the action
   * @returns {string} current state (tracking/resolved/rejected)
   */
  this.state = function() {
    return state;
  };

  /**
   * Whether the action is still in progress
   * @returns {boolean} true if action is in progress
   */
  this.inProgress = function() {
    return state == 'tracking';
  };

  /**
   * Whether the action has completed
   * @returns {boolean} true if action has completed
   */
  this.isResolved = function() {
    return state == 'resolved';
  };

  /**
   * Whether the action has failed
   * @returns {boolean} true if action has failed
   */
  this.isRejected = function() {
    return state == 'rejected';
  };
};

/**
 * Flux Store for keeping track of Action statuses
 * @type {{}}
 */
var ActionMonitorStore = {
  $initialize : function() {
    this.statuses = {};
  },

  $processEvent : function(event) {
    switch(event.name()) {
      case ACTION_MONITOR_EVENT_NAME:
        this._processStatusChange(event.payload());
        break;
      default:
        break;
    }
  },

  //
  // Accessors
  //

  /**
   * Get the status of an Action
   * @param {number} action_id - action id
   * @returns {ActionStatus}
   */
  getActionStatus : function(action_id) {
    return this.statuses[action_id];
  },

  //
  // Private
  //

  _processStatusChange : function(payload) {
    var action_id = payload.action_id;
    var status    = null;

    switch (payload.state) {
      case 'track':
        status = new ActionStatus(action_id, 'tracking');
        break;
      case 'resolve':
        status = new ActionStatus(action_id, 'resolved', payload.data);
        break;
      case 'reject':
        status = new ActionStatus(action_id, 'rejected', payload.data);
        break;
    }

    if (status) {
      this.statuses[action_id] = status;
      this.emitChange();
    }
  }
};

/**
 * Action Status change callback
 * @callback ActionMonitorCallback
 * @param {ActionStatus} action_status - current action status
 */


/**
 * React Mixin for listening to Action status change
 * @type {*}
 * @example
 * React.createClass({
 *   mixins: [dyna.DynaFluxMixin(), dyna.addons.ActionMonitorMixin],
 *
 *   // ...
 *
 *   _buzzerClick : function() {
 *     var action = ActionFactory.buzzClick();
 *     this.monitorAction(action, this._actionUpdate);
 *     action.dispatch(this.flux().action_dispatcher);
 *   },
 *
 *   _actionUpdate : function(action_status) {
 *     this.setState({ action_state : action_status.inProgress() ? 'processing' : 'clicked' });
 *   }
 * });
 */
var ActionMonitorMixin = {
  componentDidMount : function() {
    this.__action_listeners = [];
    this.flux().store(ACTION_MONITOR_STORE_NAME).addChangeListener(this.__processActionChange);
  },

  componentWillUnmount : function() {
    this.flux().store(ACTION_MONITOR_STORE_NAME).removeChangeListener(this.__processActionChange);
  },

  /**
   * Listen for change in Action state.
   * The provided callback will be called upon changes of Action states.
   * The listener will automatically be removed after the Action is resolved/rejected.
   * @param {Action}                action   - action to listen for
   * @param {ActionMonitorCallback} callback - listener callback
   */
  monitorAction : function(action, callback) {
    this.__action_listeners.push({ action_id: action.id(), callback: callback });
  },

  __processActionChange : function() {
    var self = this;

    var completed = [];
    var callbacks = [];

    this.__action_listeners.forEach(function(listener, index) {
      var action_id = listener.action_id;
      var status    = self.flux().store(ACTION_MONITOR_STORE_NAME).getActionStatus(action_id);

      if (status && status.state != listener.state) {
        listener.state = status.state;
        if (listener.callback) callbacks.push(listener.callback.bind(self, status));
        if (status.isResolved() || status.isRejected()) completed.unshift(index);
      }
    });

    // removes listeners for completed actions
    completed.forEach(function(index) {
      self.__action_listeners.splice(index, 1);
    });

    // executes the listener callbacks
    callbacks.forEach(function(cb) { cb(); });
  }
};

/**
 * Object for updating the state of Action
 * @param {EventDispatcher} event_dispatcher - event dispatcher instance
 * @constructor
 * @example
 * // In Flux coordinator
 * var ActionMonitor = new dyna.addons.ActionMonitor(this.flux.event_dispatcher);
 *
 * ActionMonitor.start(action);
 * setTimeout(function() {
 *   EventFactory.someEvent().dispatch(self.flux.event_dispatcher);
 *   ActionMonitor.resolve(action);
 * }, 3000);
 */
var ActionMonitor = function(event_dispatcher) {
  /**
   * Start monitoring an Action
   * @param {Action} action - action to monitor
   */
  this.start = function(action) {
    EventFactory.actionStateChange({
      action_id: action.id(),
      state    : 'track'
    }).dispatch(event_dispatcher);
  };

  /**
   * Resolve a monitored Action
   * @param {Action} action - action to resolve
   * @param {*}      data   - any data to be pass along with the state change
   */
  this.resolve = function(action, data) {
    EventFactory.actionStateChange({
      action_id: action.id(),
      state    : 'resolve',
      data     : data
    }).dispatch(event_dispatcher);
  };

  /**
   * Reject a monitored Action
   * @param {Action} action - action to reject
   * @param {*}      error  - any error/data to be pass along with the state change
   */
  this.reject = function(action, error) {
    EventFactory.actionStateChange({
      action_id: action.id(),
      state    : 'reject',
      data     : error
    }).dispatch(event_dispatcher);
  };
};

//
// Exports
//

// register the ActionMonitorStore as a built-in store
registerStore(ACTION_MONITOR_STORE_NAME, ActionMonitorStore);

module.exports = {
  ActionMonitor     : ActionMonitor,
  ActionMonitorMixin: ActionMonitorMixin
};