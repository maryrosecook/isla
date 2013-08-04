/*
  Utils
  Some handy fns.
*/

;(function(exports) {
  exports.Utils = {};

  exports.Utils.type = function(x) {
    return Object.prototype.toString.call(x).match(/\[object ([^\]]+)\]/)[1];
  };
})(typeof exports === 'undefined' ? this.Isla : exports);
