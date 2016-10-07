'use strict';

(function(dyna) {
  dyna.registerStore('BuzzerStore', {
    $initialize : function() {
      this.buzzer_status = 'waiting';
    },

    $processEvent : function(event) {
      if (event.name() == BuzzEventFactory.EVENTS.statusChange) {
        this.changeStatus(event.payload());
      }
    },

    changeStatus : function(status) {
      this.buzzer_status = status;
      this.emitChange();
    },

    getStatus : function() {
      return this.buzzer_status;
    }
  });
}(dyna));