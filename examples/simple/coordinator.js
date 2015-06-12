'use strict';

(function(dyna) {
  var Events = dyna.createEventFactory({
    statusChange : function(status) {
      return this.createEvent('buzzer.status-change', status);
    }
  });

  var Buzzer = function() {
    this.$start = function() {
      this.flux.action_dispatcher.addListener('buzzer-clicked', _buzzClicked.bind(this));
    };

    //
    // Private Method
    //

    function _buzzClicked(event) {
      _setStatus.call(this, event.payload());
    }

    function _setStatus(status) {
      Events.statusChange(status).dispatch(this.flux.event_dispatcher);
    }
  };

  dyna.registerCoordinator('Buzzer', Buzzer);
}(dyna));