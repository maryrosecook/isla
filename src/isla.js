/*
  Isla
  Parser, interpreter etc hang off this.
*/

;(function(exports) {
  var Isla;
  if(typeof module !== 'undefined' && module.exports) { // node
    Isla = {};
    Isla.Utils = require('./utils').Utils;
    Isla.Grammar = require('./grammar').Grammar;
    Isla.Library = require('./library').Library;
    Isla.Parser = require('./parser').Parser;
    Isla.Interpreter = require('./interpreter').Interpreter;
  } else { // browser
    Isla = {};
  }

  exports.Isla = Isla;
})(typeof exports === 'undefined' ? this : exports);
