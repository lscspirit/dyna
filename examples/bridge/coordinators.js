'use strict';

(function(dyna) {
  var event_names   = {
    STATUS_CHANGE: 'buzzer.status-change'
  };
  window.event_factory = dyna.createEventFactory(event_names, {
    statusChange : function(status) {
      return this.createEvent(this.EVENTS.STATUS_CHANGE, status);
    }
  });

  var BuzzerWithBridge = function() {
    this.$start = function() {
      this.flux.action_dispatcher.addListener('buzzer-clicked', _buzzClicked.bind(this));
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
      event_factory.statusChange(status).dispatch(this.flux.event_dispatcher);
    }
  };

  // bridge interface
  BuzzerWithBridge.$BridgeInterface = ['click'];

  var BuzzerUsesBridge = function() {
    var bridged_buzzer = dyna.useBridge(BuzzerWithBridge); // (optional) this creates a noop interface

    this.$start = function() {
      this.flux.action_dispatcher.addListener(action_factory.ACTIONS.CLICKED, _buzzClicked.bind(this));
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
      event_factory.statusChange(status).dispatch(this.flux.event_dispatcher);
    }
  };

  dyna.registerCoordinator('BuzzerWithBridge', BuzzerWithBridge);
  dyna.registerCoordinator('BuzzerUsesBridge', BuzzerUsesBridge);
}(dyna));