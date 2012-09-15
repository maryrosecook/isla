/*
  Parser
  Turns stream of tokens into abstract syntax tree.
*/

;(function() {
  var fs = require("fs");
  var utils = require("./utils");
  var _ = require("Underscore");
  var multimethod = require('multimethod');
  var peg = require("pegjs");

  var grammar = fs.readFileSync("isla.peg", "utf-8");
  var pegParser = peg.buildParser(grammar);

  var parse = function(str) {
    str += "\n"; // auto add newline.  Dupes are fine.
    console.log(str)
    var ast = pegParser.parse(str);
    return ast;
  };

  var extract = multimethod()
    .dispatch(function(__, route) {
      return typeof(_.first(route));
    })
    .when("string", function(ast, route) {
      var nxt = _.first(route);
      if(ast.tag === nxt) {
        return extract(ast.c, _.rest(route));
      }
      else {
        throw JSON.stringify(ast) + " is not " + nxt;
      }
    })
    .when("number", function(ast, route) {
      var nxt = _.first(route);
      if(_.has(ast, nxt)) {
        return extract(ast[nxt], _.rest(route));
      }
      else {
        throw ast + " does not have " + nxt;
      }
    })
    .when("undefined", function(ast, __) {
      return ast;
    })
    .default(function(a, r) {
      throw "Route items must be tags or indices.";
    });

  this.extract = extract;
  this.parse = parse;
}).call(this);
