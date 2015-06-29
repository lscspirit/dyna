'use strict';

(function(dyna) {
  var Buzzer = function() {
    this.$start = function() {
      this.flux.action_dispatcher.addListener(action_factory.ACTIONS.CLICKED, _buzzClicked.bind(this));
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