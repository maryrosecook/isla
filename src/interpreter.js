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
      var valueNode = interpretAst(node[2], env);
      var value = assignmentValue(valueNode);

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
      var currentListEval = evaluateValue(Isla.Parser.extract(assignee,
                                                              "assignee", 0),
                                                              env);
      var operation = Isla.Parser.extract(node, 0, "list_operation", 0).tag;
      var itemEval = interpretAst(Isla.Parser.extract(node, 1), env);
      var item = assignmentValue(itemEval);

      var list = currentListEval.val;
      list[operation](item);

      var env = assign(env, assignee, currentListEval.val);
      return rmRet(env);
    })

    .when("invocation", function(ast, env) {
      var fn = resolve({
        ref: interpretAst(Isla.Parser.extract(ast, "invocation", 0), env)
      }, env).fn;
      var param = resolve(interpretAst(Isla.Parser.extract(ast,
                                                           "invocation", 1),
                                       env).val, env);
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

  var evaluateValue = multimethod()
    .dispatch(function(node, env) {
      return node.tag;
    })

    .when("literal", function(node, env) {
      return { val: interpretAst(node.c[0], env) };
    })

    .when("variable", function(node, env) {
      return evaluateValue(node.c[0], env);
    })

    .when("scalar", function(node, env) {
      var identifier = interpretAst(node.c[0], env);
      var val = env.ctx[identifier];
      if (val === undefined) {
        nonExistentError([identifier]);
      } else {
        return { ref: identifier, val: val };
      }
    })

    .when("object", function(node, env) {
      var objNode = Isla.Parser.extract(node, "object");
      checkIdentifierParts(objNode, env);
      var parts = identifierParts(objNode, env);
      var val = env.ctx;
      for (var i = 0; i < objNode.length; i++) {
        var id = Isla.Parser.extract(objNode, i, "identifier", 0);
        val = val[canonical(id, env)];
      }

      return { ref: parts, val: val };
    });

  var nonExistentError = function(identifier) {
    throw { message:"I have not heard of " + identifier.join(" ") + "." };
  };

  var checkIdentifierParts = function(objNode, env) {
    var parts = identifierParts(objNode, env);
    var val = env.ctx;
    for (var i = 0; i < parts.length; i++) {
      if (val === undefined) {
        nonExistentError(parts.slice(0, i));
      } else {
        val = val[canonical(Isla.Parser.extract(objNode, i, "identifier", 0), env)];
      }
    }
  };

  var identifierParts = function(objNode, env) {
    var parts = [];
    for (var i = 0; i < objNode.length; i++) {
      parts.push(Isla.Parser.extract(objNode, i, "identifier", 0));
    }

    return parts;
  };

  var assign = multimethod()
    .dispatch(function(__, assigneeNode) {
      return assigneeNode.c[0].tag;
    })

    .when("scalar", function(env, assigneeNode, value) {
      var identifier = Isla.Parser.extract(assigneeNode, "assignee", 0,
                                           "scalar", 0, "identifier", 0);
      env.ctx[identifier] = value;
      return env;
    })

    .when("object", function(env, assigneeNode, value) {
      var objNode = Isla.Parser.extract(assigneeNode, "assignee", 0, "object");
      checkIdentifierParts(objNode, env);
      var slot = env.ctx;
      for (var i = 0; i < objNode.length - 1; i++) {
        var id = canonical(Isla.Parser.extract(objNode, i, "identifier", 0), env);
        slot = slot[id];
      }

      slot[Isla.Parser.extract(objNode, i, "identifier", 0)] = value;
      return env;
    });

  // returns appropriate value for valueNode being assigned
  // actual value for primitives, refs
  var assignmentValue = multimethod()
    .dispatch(function(valueNode) {
      return typeof(valueNode.val);
    })

    .when("string", function(valueNode) {
      return valueNode.val;
    })

    .when("number", function(valueNode) {
      return valueNode.val;
    })

    .default(function(valueNode) {
      return valueNode.ref === undefined ? valueNode.val :
                                           { ref: valueNode.ref };
    });

  var resolve = multimethod()
    .dispatch(function(thing) {
      if (thing == null) {
        return thing;
      } else if(thing._meta && thing._meta.type === "list") {
        return "list";
      } else if(Isla.Utils.type(thing) === "Object") {
        return thing.ref === undefined ? "object" : "ref";
      }
    })

    .when("ref", function(thing, env) {
      return resolve(env.ctx[thing.ref], env);
    })

    .when("object", function(thing, env) {
      for(var i in thing) {
        if(i !== "_meta") {
          thing[i] = resolve(thing[i], env);
        }
      }

      return thing;
    })

    .when("list", function(thing, env) {
      var items = thing.items();
      var resolvedList = new Isla.Library.List();
      for(var i = 0; i < items.length; i++) {
        resolvedList.add(resolve(items[i], env));
      }

      return resolvedList;
    })

    .default(function(thing) {
      return thing;
    });

  var canonical = function(identifier, env) {
    var next = env.ctx[identifier];
    if (next === undefined) { // got scalar - just return id
      return identifier;
    } else if (next.ref !== undefined) { // keep going to find canon
      return canonical(next.ref, env);
    } else { // got value - return id
      return identifier;
    }
  };

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
  exports.Interpreter.resolve = resolve;
  exports.Interpreter.evaluateValue = evaluateValue;
  exports.Interpreter.interpretAst = interpretAst;
})(typeof exports === 'undefined' ? this.Isla : exports);
