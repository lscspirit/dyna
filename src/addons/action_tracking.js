'use strict';

var assign = require('object-assign');
var compare = require('../utils/compare');

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
 * Extend a Flux Store specification with the getActionStatus() for processing
 * Action status that is piggybacked on the Event
 * @param {{}}   store - Flux Store specification
 * @returns {{}} the extended Flux Store specification
 * @example
 * var Store = ActionTrackingStoreExt({
 *   $processEvent : function(event) {
 *     var action_status = this.getActionStatus(event);
 *     // ...
 *   }
 * });
 */
var ActionTrackingStoreExt = function(store) {
  return assign({}, store, {
    /**
     * Get the ActionStatus from tracking data piggybacked in the Event object if available
     * @param {Event} event - the Flux Event object
     * @returns {ActionStatus|null} the ActionStatus if available
     */
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

/**
 * Extend a Flux Event object with action tracking methods: trackAction(), resolveAction()
 * and rejectAction(). Use this extended object to communicate Action status with Flux Stores.
 * Action status pass through to the Flux Store this way can be accessed through the use of
 * getActionStatus() method in the Store @see {@link ActionTrackingStoreExt}
 * @param {Event} event - Flux Event object
 * @returns {Event} the extend Event object
 * @example
 * var evt = EventFactory.someEvent();
 * evt = ActionTrackingEvent(evt);
 * evt.trackAction(action).dispatch(this.flux.event_dispatcher);
 */
var ActionTrackingEvent = function(event) {
  event.__tracking_payload = null;

  /**
   * Add a message to the Event indicating the start of an Action
   * @param {Action} action - Action object to track
   * @returns {Event} the Event object itself for chaining
   */
  event.trackAction = function(action) {
    event.__tracking_payload = { action_id: action.id(), state: 'track' };
    return this;
  };

  /**
   * Add a message to the Event indicating the completion of an Action
   * @param {Action} action - Action object to track
   * @param {*}      data   - any data to be associated with the completion
   * @returns {Event} the Event object itself for chaining
   */
  event.resolveAction = function(action, data) {
    event.__tracking_payload = { action_id: action.id(), state: 'resolve', data: data };
    return this;
  };

  /**
   * Add a message to the Event indicating the failing of an Action
   * @param {Action} action - Action object to track
   * @param {*}      error  - any error message or data
   * @returns {Event} the Event object itself for chaining
   */
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