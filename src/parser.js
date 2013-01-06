/*
  Parser
  Turns stream of tokens into abstract syntax tree.
*/

;(function(exports) {
  var Isla, _, multimethod, pegjs;
  if(typeof module !== 'undefined' && module.exports) { // node
    _ = require("Underscore");
    multimethod = require('multimethod');
    pegjs = require("pegjs");
    Isla = {};
    Isla.Grammar = require('./grammar').Grammar;
  } else { // browser
    _ = window._;
    multimethod = window.multimethod;
    pegjs = window.PEG;
    Isla = window.Isla;
  }

  var pegParser = pegjs.buildParser(Isla.Grammar.peg, {
    trackLineAndColumn: true
  });

  exports.Parser = {};

  exports.Parser.parse = function(str) {
    str += "\n"; // auto add newline.  Dupes are fine.
    var ast = pegParser.parse(str);
    return ast;
  };

  var extract = multimethod()
    .dispatch(function(__, nxt) {
      return typeof(nxt);
    })

    .when("string", function(ast, nxt) {
      if(ast.tag === nxt) {
        return extractNext(ast.c, arguments);
      }
      else {
        throw new Error(JSON.stringify(ast) + " is not " + nxt);
      }
    })

    .when("number", function(ast, nxt) {
      return extractNext(ast[nxt], arguments);
    })

    .when("undefined", function(ast) {
      return ast;
    })

    .default(function() {
      throw "Route items must be tags or indices.";
    });

  var extractNext = function(ast, args) {
    var nextArgs = _.rest(_.rest(_.toArray(args)));
    nextArgs.unshift(ast);
    return extract.apply(this, nextArgs);
  }

  exports.Parser.extract = extract;
})(typeof exports === 'undefined' ? this.Isla : exports);
