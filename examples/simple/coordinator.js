'use strict';

(function(dyna) {
  var Buzzer = function() {
    this.$listen = function() {
      return [
        { action: buzz_action_creator.ACTIONS.CLICK, handler: _buzzClicked.bind(this) }
      ];
    };

    this.$start = function() {
    };

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

  dyna.registerCoordinator('Buzzer', Buzzer);
}(dyna));