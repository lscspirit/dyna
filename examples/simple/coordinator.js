'use strict';

(function(dyna) {
  var Buzzer = function() {
    this.$listen = function() {
      return [
        { action: BuzzActionFactory.ACTIONS.click, handler: _buzzClicked.bind(this) }
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
      BuzzEventFactory(this.flux).statusChange(status);
    }
  };

  dyna.registerCoordinator('Buzzer', Buzzer);
}(dyna));