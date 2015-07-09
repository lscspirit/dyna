'use strict';

(function(dyna) {
  var Buzzer = function() {
    this.$listen = function() {
      return [
        { action: action_factory.ACTIONS.CLICKED, handler: _buzzClicked.bind(this) }
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
      event_factory.statusChange(status).dispatch(this.flux.event_dispatcher);
    }
  };

  dyna.registerCoordinator('Buzzer', Buzzer);
}(dyna));