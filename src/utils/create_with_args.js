module.exports = function(constructor, args) {
  'use strict';

  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
};