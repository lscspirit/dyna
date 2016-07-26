'use strict';

(function(dyna) {
  //
  // Component
  //
  var SimpleComp = React.createClass({displayName: "SimpleComp",
    componentDidMount : function() {
      console.log('React component mounted');
    },

    render : function() {
      return React.createElement("div", null, "All coordinators started!!");
    }
  });
  dyna.registerComponent('SimpleComp', SimpleComp);

  //
  // Coordinator
  //

  var Normal = function() {
    this.$start = function() {
      console.log('starting normal coordinator');
    };
  };

  dyna.registerCoordinator('Normal', Normal);
}(dyna));