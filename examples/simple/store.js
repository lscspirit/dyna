'use strict';

(function(dyna) {
  dyna.registerStore('BuzzerStore', {
    $initialize : function() {
      this.buzzer_status = 'waiting';
    },

    $processEvent : function(event) {
      if (event.name() == buzz_event_creator.EVENTS.STATUS_CHANGE) {
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