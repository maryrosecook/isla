/*
  Interpreter
  Executes abstract syntax tree.
*/

;(function(exports) {
  var Isla, _, multimethod;
  if(typeof module !== 'undefined' && module.exports) { // node
    _ = require("Underscore");
    multimethod = require('multimethod');
    Isla = {};
    Isla.Utils = require('./utils').Utils;
    Isla.Library = require('./library').Library;
    Isla.Parser = require('./parser').Parser;
  } else { // browser
    _ = window._;
    multimethod = window.multimethod;
    Isla = window.Isla;
  }

  exports.Interpreter = {};

  // takes raw Isla code, parses then interprets
  exports.Interpreter.interpret = function(code, env) {
    return interpretAst(Isla.Parser.parse(code), env);
  };

  var interpretAst = multimethod()
    .dispatch(function(ast, env) {
      return ast.tag;
    })

    .when("root", function(ast, env) {
      if(env === undefined) {
        env = Isla.Library.getInitialEnv();
      }

      return runSequence(ast.c, env);
    })

    .when("block", function(ast, env) {
      return runSequence(ast.c, env);
    })

    .when("expression", function(ast, env) {
      return interpretAst(ast.c[0], env);
    })

    .when("value_assignment", function(ast, env) {
      var node = Isla.Parser.extract(ast, "value_assignment");
      var assignee = node[0];
      var value = interpretAst(node[2], env);

      var env = assign(env, assignee, value);
      return rmRet(env);
    })

    .when("type_assignment", function(ast, env) {
      var node = Isla.Parser.extract(ast, "type_assignment");
      var assignee = node[0];
      var typeIdentifier = interpretAst(node[2], env);
      var value = instantiateType(typeIdentifier, env.ctx);
      var env = assign(env, assignee, value);
      return rmRet(env);
    })

    .when("list_assignment", function(ast, env) {
      var node = Isla.Parser.extract(ast, "list_assignment");
      var assignee = node[3];
      var list = evaluateValue(Isla.Parser.extract(assignee, "assignee", 0),
                               env);
      var operation = Isla.Parser.extract(node, 0, "list_operation", 0).tag;
      var item = interpretAst(Isla.Parser.extract(node, 1), env);

      list[operation](item);

      var env = assign(env, assignee, list);
      return rmRet(env);
    })

    .when("invocation", function(ast, env) {
      var fn = evaluateValue(Isla.Parser.extract(ast, "invocation", 0), env).fn;
      var param = interpretAst(Isla.Parser.extract(ast, "invocation", 1),
                               env);
      env.ret = fn(env, param);
      return env;
    })

    .when("value", function(ast, env) {
      var node = Isla.Parser.extract(ast, "value");
      return evaluateValue(node[0], env);
    })

    .when("integer", function(ast, env) {
      return Isla.Parser.extract(ast, "integer", 0);
    })

    .when("string", function(ast, env) {
      return Isla.Parser.extract(ast, "string", 0);
    })

    .when("identifier", function(ast, env) {
      return Isla.Parser.extract(ast, "identifier", 0);
    })

    .default(function(ast, env) {
      throw { message:"You've forgotten a tag type." };
    });

  var checkVariable = function(parts, env) {
    return _.reduce(parts, function(a, x, i) {
      return a[x] !== undefined ? a[x] : nonExistentError(parts.slice(0, i + 1));
    }, env.ctx);
  };

  var evaluateValue = multimethod()
    .dispatch(function(node, env) {
      return node.tag;
    })

    .when("literal", function(node, env) {
      return interpretAst(node.c[0], env);
    })

    .when("identifier", function(node, env) { // for function names
      var parts = [node.c[0]];
      return checkVariable(parts, env);
    })

    .when("variable", function(node, env) {
      var parts = Isla.Parser.identifierParts(Isla.Parser.extract(node, "variable"), env);
      return checkVariable(parts, env);
    })

  var nonExistentError = function(identifier) {
    throw { message:"I have not heard of " + identifier.join(" ") + "." };
  };

  var assign = multimethod()
    .dispatch(function(__, assigneeNode) {
      return Isla.Parser.extract(assigneeNode, "assignee", 0, "variable").length
    })

    .when(1, function(env, assigneeNode, value) {
      var identifier = Isla.Parser.extract(assigneeNode, "assignee", 0,
                                           "variable", 0, "identifier", 0);
      env.ctx[identifier] = value;
      return env;
    })

    .default(function(env, assigneeNode, value) {
      var objNode = Isla.Parser.extract(assigneeNode, "assignee", 0, "variable");
      var parts = Isla.Parser.identifierParts(objNode, env);

      _.reduce(parts.slice(0, parts.length - 1), function(a, x, i) {
        return a[x] !== undefined ? a[x] : nonExistentError(parts.slice(0, i + 1));
      }, env.ctx);

      var slot = env.ctx;
      for (var i = 0; i < objNode.length - 1; i++) {
        var id = Isla.Parser.extract(objNode, i, "identifier", 0);
        slot = slot[id];
      }

      if (Isla.Utils.type(slot) === 'String') {
        throw { message: parts[parts.length - 2] + " can not have " +
                parts[parts.length - 1] + "." };
      }

      slot[Isla.Parser.extract(objNode, i, "identifier", 0)] = value;
      return env;
    });

  var runSequence = function(nodes, env) {
    if(nodes.length === 0) {
      return env;
    }
    else {
      return runSequence(_.rest(nodes), interpretAst(_.first(nodes),
                         rmRet(env)));
    }
  }

  var rmRet = function(env) {
    env.ret = null;
    return env;
  }

  // makes a new Isla object of the passed type
  var instantiateType = function(type, ctx) {
    var typeFn = ctx._types[type];
    if(typeFn === undefined) {
      typeFn = ctx._types.generic;
    }

    var obj = typeFn();
    obj._meta = { type:type };
    return obj;
  };

  exports.Interpreter.instantiateType = instantiateType;
  exports.Interpreter.evaluateValue = evaluateValue;
  exports.Interpreter.interpretAst = interpretAst;
})(typeof exports === 'undefined' ? this.Isla : exports);
