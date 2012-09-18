/*
  Util
  Some handy fns.
*/

;(function() {
  var _ = require("Underscore");

  this.type = function(x) {
    return Object.prototype.toString.call(x).match(/\[object ([^\]]+)\]/)[1];
  };

  this.merge = function(a, b) {
    var c = {};
    for(var i in a) {
      c[i] = a[i];
    }

    for(var i in b) {
      c[i] = b[i];
    }

    return c;
  }
}).call(this);
