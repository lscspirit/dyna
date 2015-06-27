'use strict';

var deferred = require('deferred');
var compare  = require('./compare');

var domReadyPromise = undefined;

/**
 * A simple implementation of DOM Ready method similar to jQuery's ready()
 *
 * @param {function} callback - dom ready callback
 */
function domReady(callback) {
  if (compare.isUndefined(domReadyPromise)) domReadyPromise = waitForDomReady();
  domReadyPromise.done(callback);
}

function waitForDomReady() {
  var domReadyDefer = deferred();

  // if the dom is already at 'complete' ready state
  if (document.readyState === 'complete') {
    domReadyDefer.resolve();  // immediately resolve the promise
  } else {
    if (document.addEventListener) {
      // Mozilla, Opera, Webkit

      var handler = function() {
        document.removeEventListener('DOMContentLoaded', handler, false);
        domReadyDefer.resolve();
      };
      document.addEventListener('DOMContentLoaded', handler, false);
    } else if (document.attachEvent) {
      // If IE event model is used
      var ie_handler = function() {
        if (document.readyState === 'complete') {
          document.detachEvent('onreadystatechange', ie_handler);
          domReadyDefer.resolve();
        }
      };
      document.attachEvent('onreadystatechange', ie_handler)
    }

    // A fallback to window.onload that will always work
    var onload_handler = function() {
      window.removeEventListener('load', onload_handler);
      domReadyDefer.resolve();
    };
    window.addEventListener('load', onload_handler);
  }

  return domReadyDefer.promise;
}

//
// Exports
//

module.exports = domReady;