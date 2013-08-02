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
    Isla.Utils = require('./utils').Utils;
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

  // returns first node tagged with passed tag
  var find = function(node, tag) {
    if (node.tag === tag) {
      return node;
    } else if (node.c !== undefined && Isla.Utils.type(node.c) === "Array") {
      return _.reduce(node.c, function(a, x) {
        return a === undefined ? find(x, tag) : a;
      }, undefined);
    }
  };

  var extractNext = function(ast, args) {
    var nextArgs = _.rest(_.rest(_.toArray(args)));
    nextArgs.unshift(ast);
    return extract.apply(this, nextArgs);
  };

  var identifierParts = function(objNode, env) {
    var parts = [];
    for (var i = 0; i < objNode.length; i++) {
      parts.push(extract(objNode, i, "identifier", 0));
    }

    return parts;
  };

  exports.Parser.extract = extract;
  exports.Parser.find = find;
  exports.Parser.identifierParts = identifierParts;
})(typeof exports === 'undefined' ? this.Isla : exports);
