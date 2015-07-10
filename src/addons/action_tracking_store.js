'use strict';

var assign = require('object-assign');

var ActionStatus = function(action_id) {
  var _in_progess = true;
  var _data       = null;
  var _error      = null;

  /**
   * Change the status to completed
   * @param {*} data - extra data to be associated with this completed status
   */
  this.complete = function(data) {
    _in_progess = false;
    _data       = data;
  };

  /**
   * Change the status to failed
   * @param {*} error - error message or data to be associated with this failed status
   */
  this.reject = function(error) {
    _in_progess = false;
    _error      = error || true;
  };

  /**
   * Id of the action that this status is tracking
   * @returns {number} action id
   */
  this.actionId = function() {
    return action_id;
  };

  /**
   * Whether the action being tracked is still in progress
   * @returns {boolean} true if action is still in progress
   */
  this.inProgress = function() {
    return _in_progess;
  };

  /**
   * Whether the action being tracked has failed
   * @returns {boolean} true if action failed
   */
  this.failed = function() {
    return _in_progess === false && _error;
  };

  /**
   * Whether the action being tracked has completed successfully
   * @returns {boolean} true if action has completed
   */
  this.succeed = function() {
    return _in_progess === false && !_error;
  };

  /**
   * The error message/data
   * @returns {*} error message if available
   */
  this.error = function() {
    return _error === true ? null : _error;
  };

  /**
   * The status data
   * @returns {*} status data if available
   */
  this.data = function() {
    return _data;
  };
};

/**
 * Extend the Flux store specification with action tracking logic and functions
 * @param {Object} store - store specification
 * @returns {Object} store specification with action tracking extension
 */
var createActionTrackingStore = function(store) {
  return assign({}, store, {
    $initialize : function() {
      this._action_status = {};
      store.$initialize();
    },

    /**
     * Begin tracking an action
     * @param {number} action_id - id of the action
     */
    trackAction : function(action_id) {
      this._action_status[action_id] = new ActionStatus(action_id);
    },

    /**
     * Finish tracking an action
     * @param {number} action_id - id of the action
     * @param {*}      data      - data to be associated with the completion status
     */
    completeAction : function(action_id, data) {
      var status = this._action_status[action_id];
      if (status) status.complete(data);
    },

    /**
     * Finish tracking an action with error
     * @param {number} action_id - id of the action
     * @param {*}      error     - error data to be associated with the failed status
     */
    rejectAction : function(action_id, error) {
      var status = this._action_status[action_id];
      if (status) status.reject(error);
    },

    /**
     * Retrieve an status for a particular action
     * @param {number} action_id - id of the action
     * @returns {ActionStatus} action status
     */
    actionStatus : function(action_id) {
      return this._action_status[action_id];
    }
  });
};

module.exports = {
  createActionTrackingStore: createActionTrackingStore
};