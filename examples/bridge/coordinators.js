'use strict';

(function(dyna) {
  window.buzz_event_creator = dyna.createEventCreator('buzz', {
    statusChange : function(status) { return status; }
  });

  var BuzzerWithBridge = function() {
    this.$listen = function() {
      return [
        { action: buzz_action_creator.ACTIONS.click, handler: _buzzClicked.bind(this) }
      ];
    };

    this.$start = function() {
    };

    //
    // Create bridge
    //

    // This allow this buzzer to be clicked through the Bridge
    this.$bridge = dyna.createBridge(this, {
      click : function(status) {
        _setStatus.call(this, status);
      }
    });

    //
    // Private Method
    //

    function _buzzClicked(event) {
      _setStatus.call(this, event.payload());
    }

    function _setStatus(status) {
      buzz_event_creator.instance(this.flux).statusChange(status);
    }
  };

  // bridge interface
  BuzzerWithBridge.$BridgeInterface = ['click'];

  var BuzzerUsesBridge = function() {
    var bridged_buzzer = dyna.useBridge(BuzzerWithBridge); // (optional) this creates a noop interface

    this.$listen = function() {
      return [
        { action: buzz_action_creator.ACTIONS.click, handler: _buzzClicked.bind(this) }
      ];
    };

    this.$start = function() {
    };

    this.setBridge = function(bridge) {
      // create a bridge interface that is actually linked to a bridge
      bridged_buzzer = dyna.useBridge(BuzzerWithBridge, bridge);
    };

    //
    // Private Method
    //

    function _buzzClicked(event) {
      _setStatus.call(this, event.payload());

      // also click the BuzzerWithBridge
      bridged_buzzer.click('clicked through bridging');
    }

    function _setStatus(status) {
      buzz_event_creator.instance(this.flux).statusChange(status);
    }
  };

  dyna.registerCoordinator('BuzzerWithBridge', BuzzerWithBridge);
  dyna.registerCoordinator('BuzzerUsesBridge', BuzzerUsesBridge);
}(dyna));