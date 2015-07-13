'use strict';

var assign = require('object-assign');
var compare = require('../utils/compare');

/**
 * An object for tracking action status
 * @param {number} action_id - action id
 * @param {string} state     - action state ('tracking', 'resolved', 'rejected')
 * @param {*}      [data]    - action data
 * @constructor
 */
var ActionStatus = function(action_id, state, data) {
  //
  // Accessors
  //

  this.actionId = function() {
    return action_id;
  };

  this.data = function() {
    return data;
  };

  this.inProgress = function() {
    return state == 'tracking';
  };

  this.isResolved = function() {
    return state == 'resolved';
  };

  this.isRejected = function() {
    return state == 'rejected';
  };
};

var ActionTrackingStoreExt = function(store) {
  return assign({}, store, {
    getActionStatus : function(event) {
      var tracking_payload = event.__tracking_payload;

      if (!compare.isUndefined(tracking_payload)) {
        var action_id = tracking_payload.action_id;
        switch (tracking_payload.state) {
          case 'track':
            return new ActionStatus(action_id, 'tracking');
          case 'resolve':
            return new ActionStatus(action_id, 'resolved', tracking_payload.data);
          case 'reject':
            return new ActionStatus(action_id, 'rejected', tracking_payload.data);
        }
      }

      return null;
    }
  });
};

var ActionTrackingEvent = function(event) {
  event.__tracking_payload = null;

  event.trackAction = function(action) {
    event.__tracking_payload = { action_id: action.id(), state: 'track' };
    return this;
  };

  event.resolveAction = function(action, data) {
    event.__tracking_payload = { action_id: action.id(), state: 'resolve', data: data };
    return this;
  };

  event.rejectAction = function(action, error) {
    event.__tracking_payload = { action_id: action.id(), state: 'reject', data: error };
    return this;
  };

  return event;
};

module.exports = {
  ActionTrackingEvent   : ActionTrackingEvent,
  ActionTrackingStoreExt: ActionTrackingStoreExt
};