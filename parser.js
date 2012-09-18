/*
  Parser
  Turns stream of tokens into abstract syntax tree.
*/

;(function() {
  var fs = require("fs");
  var _ = require("Underscore");
  var multimethod = require('multimethod');
  var peg = require("pegjs");

  var grammar = fs.readFileSync("isla.peg", "utf-8");
  var pegParser = peg.buildParser(grammar);

  this.parse = function(str) {
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

  this.extract = extract;
}).call(this);
