/*
  Utils
  Some handy fns.
*/

;(function(exports) {
  exports.Utils = {};

  exports.Utils.type = function(x) {
    return Object.prototype.toString.call(x).match(/\[object ([^\]]+)\]/)[1];
  };

  exports.Utils.merge = function(a, b) {
    var c = {};
    for (var i in a) {
      c[i] = a[i];
    }

    for (var i in b) {
      c[i] = b[i];
    }

    return c;
  }
})(typeof exports === 'undefined' ? this.Isla : exports);
