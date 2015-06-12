'use strict';

var compare = require('../utils/compare');

/**
 * Create a Bridge for use in another coordinator
 * The resulting bridge object must be assigned to the coordinator's $bridge property
 *
 * @param {Object} coordinator - coordinator for which the bridge is created. The coordinator's constructor must
 *                               have a $BridgeInterface property that defines what methods are in the bridge
 * @param {Object} impl        - implementation of methods in the bridge. All method implementations will be automatically
 *                               bind to the coordinator instance when called
 * @returns {Object} the bridge instance for use in other coordinator
 * @throws {Error} if $BridgeInterface is not defined or the implementation is invalid
 *
 * @example
 * var BuzzerWithBridge = function() {
 *   // ...
 *
 *   // This allow this buzzer to be clicked through the Bridge
 *   this.$bridge = dyna.createBridge(this, {
 *     click : function(status) {
 *       _setStatus.call(this, status);
 *     }
 *   });
 *
 *   function _setStatus(status) {
 *     // ...
 *   }
 * };
 *
 * BuzzerWithBridge.$BridgeInterface = ['click'];
 */
function createBridge(coordinator, impl) {
  var bridge = { $_constructor: coordinator.constructor };
  var bridge_interface = coordinator.constructor.$BridgeInterface;
  if (!compare.isArray(bridge_interface)) throw new Error('Coordinator constructor must have a $BridgeInterface string array.');

  bridge_interface.forEach(function(method) {
    if (method == '$_constructor') throw new Error('"$_constructor" is a reserved property. Please use another name for your method.');
    if (!compare.isFunction(impl[method])) throw new Error('Missing implementation for "' + method + '". Bridge implementation must include all methods specified in $BridgeInterface.');

    bridge[method] = impl[method].bind(coordinator);
  });

  return bridge;
}

/**
 * Use a bridge of another coordinator
 * @param {function} coordinator_constructor - Constructor of the coordinator with the bridge
 * @param {Object}   bridge                  - bridge instance. Can be acquired using flux.getBridge()
 * @returns {Object} the bridged interface
 * @throws {Error} if the bridge or the interface is invalid
 *
 * @example
 * var BuzzerUsesBridge = function() {
 *   // (optional) this creates a noop interface
 *   var bridged_buzzer = dyna.useBridge(BuzzerWithBridge);
 *
 *   this.setBridge = function(bridge) {
 *     bridged_buzzer = dyna.useBridge(BuzzerWithBridge, bridge);
 *   };
 *
 *   // ...
 *
 *   function _buzzerClicked(status) {
 *     bridge_buzzer.click('clicked through bridging');
 *   }
 * };
 *
 * // To link the bridge
 * flux_two.config(function(BuzzerUsesBridge) {
 *   BuzzerUsesBridge.setBridge(flux_one.getBridge('BuzzerWithBridge'));
 * });
 */
function useBridge(coordinator_constructor, bridge) {
  if (!compare.isFunction(coordinator_constructor)) throw new Error('Invalid coordinator constructor.');
  if (!compare.isArray(coordinator_constructor.$BridgeInterface)) throw new Error('Coordinator constructor must have a $BridgeInterface string array.');

  var result = {};
  var bridge_interface = coordinator_constructor.$BridgeInterface;
  if (compare.isUndefined(bridge)) {
    var noop = function() { };
    bridge_interface.forEach(function(method) {
      result[method] = noop;
    });
  } else {
    if (compare.isUndefined(bridge.$_constructor)) throw new Error('Invalid bridge. Bridge must have a $_constructor property. Please use createBridge() to create this bridge.');
    else if (bridge.$_constructor !== coordinator_constructor) throw new Error('The coordinator and bridge does not match. The bridge object provided is not a bridge of this coordinator.');

    bridge_interface.forEach(function(method) {
      if (!compare.isFunction(bridge[method])) throw new Error('Missing implementation for "' + method + '". Bridge implementation must include all methods specified in $BridgeInterface.');
      result[method] = bridge[method];
    });
  }

  return result;
}

//
// Exports
//

module.exports = {
  createBridge: createBridge,
  useBridge   : useBridge
};