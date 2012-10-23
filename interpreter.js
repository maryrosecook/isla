/*
  Interpreter
  Executes abstract syntax tree.
*/

;(function() {
  var _ = require("Underscore");
  var multimethod = require('multimethod');

  var library = require('./library');
  var parser = require('./parser');
  var utils = require('./utils');

  var interpret = multimethod()
    .dispatch(function(ast, env) {
      return ast.tag;
    })

    .when("root", function(ast, env) {
      if(env === undefined) {
        env = library.getInitialEnv();
      }

      return runSequence(ast.c, env);
    })

    .when("block", function(ast, env) {
      return runSequence(ast.c, env);
    })

    .when("expression", function(ast, env) {
      return interpret(ast.c[0], env);
    })

    .when("value_assignment", function(ast, env) {
      var node = parser.extract(ast, "value_assignment");
      var assignee = node[0];
      var valueNode = interpret(node[2], env);
      var value = valueNode.ref === undefined ? valueNode.val : { ref: valueNode.ref };
      var ctx = assign(env.ctx, assignee, value);
      return nreturn(ctx);
    })

    .when("type_assignment", function(ast, env) {
      var node = parser.extract(ast, "type_assignment");
      var assignee = node[0];
      var typeIdentifier = interpret(node[2], env);

      var typeFn = env.ctx.types[typeIdentifier];
      if(typeFn === undefined) {
        typeFn = env.ctx.types.generic;
      }

      var value = instantiateType(typeFn, typeIdentifier);

      var ctx = assign(env.ctx, assignee, value);
      return nreturn(ctx);
    })

    .when("list_assignment", function(ast, env) {
      var node = parser.extract(ast, "list_assignment");
      var assignee = node[3];
      var currentListEval = evaluateValue(parser.extract(assignee, "assignee", 0), env);
      if(currentListEval.val === undefined) { // no such list - show error
        var ref = currentListEval.ref;
        throw Error("I do not know of a list called "
                    + (utils.type(currentListEval.ref) === "Array"
                       ? ref[0] + " " + ref[1] : ref)
                    + ".");
      }
      else {
        var operation = parser.extract(node, 0, "list_operation", 0).tag;
        var itemEval = interpret(parser.extract(node, 1), env);
        var item = itemEval.ref === undefined ? itemEval.val : { ref: itemEval.ref };

        var list = currentListEval.val;
        list[operation](item);

        var newCtx = assign(env.ctx, assignee, currentListEval.val);
        return nreturn(newCtx);
      }
    })


    .when("invocation", function(ast, env) {
      var fn = resolve({ ref: interpret(parser.extract(ast, "invocation", 0), env) }, env);
      var param = interpret(parser.extract(ast, "invocation", 1), env).val;
      var returnVal = fn(env, param);
      return nreturn(env.ctx, returnVal);
    })

    .when("value", function(ast, env) {
      var node = parser.extract(ast, "value");
      return evaluateValue(node[0], env);
    })

    .when("integer", function(ast, env) {
      return parser.extract(ast, "integer", 0);
    })

    .when("string", function(ast, env) {
      return parser.extract(ast, "string", 0);
    })

    .when("identifier", function(ast, env) {
      return parser.extract(ast, "identifier", 0);
    })

    .default(function(ast, env) {
      throw "You've forgotten a tag type.";
    });


  var evaluateValue = multimethod()
    .dispatch(function(node, env) {
      return node.tag;
    })

    .when("literal", function(node, env) {
      return { val: interpret(node.c[0], env) };
    })

    .when("variable", function(node, env) {
      return evaluateValue(node.c[0], env);
    })

    .when("scalar", function(node, env) {
      var identifier = interpret(node.c[0], env);
      return { ref: identifier, val: env.ctx[identifier] };
    })

    .when("object", function(node, env) {
      // make more specific
      var objId = node.c[0].c[0];
      var attrId = node.c[1].c[0];
      var val = env.ctx[objId] !== undefined && env.ctx[objId][attrId] !== undefined ?
        env.ctx[objId][attrId] : undefined;
      return {
        ref: [objId, attrId], // won't work if assign obj-attr to var
        val: val
      }
    });

  var assign = multimethod()
    .dispatch(function(__, assigneeNode) {
      return assigneeNode.c[0].tag;
    })

    .when("scalar", function(ctx, assigneeNode, value) {
      var identifier = parser.extract(assigneeNode, "assignee", 0, "scalar", 0,
                                                    "identifier", 0);
      ctx[identifier] = value;
      return ctx;
    })

    .when("object", function(ctx, assigneeNode, value) {
      var objectNode = parser.extract(assigneeNode, "assignee", 0, "object");
      var objectIdentifier = parser.extract(objectNode, 0, "identifier", 0);
      var slotIdentifier = parser.extract(objectNode, 1, "identifier", 0);

      ctx[objectIdentifier][slotIdentifier] = value;
      return ctx;
    })


  var resolve = multimethod()
    .dispatch(function(thing) {
      if(thing instanceof library.IslaList) {
        return "list";
      }
      else if(utils.type(thing) === "Object") {
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
      var resolvedList = new library.IslaList();
      for(var i = 0; i < items.length; i++) {
        resolvedList.add(resolve(items[i], env));
      }

      return resolvedList;
    })

    .default(function(thing) {
      return thing;
    })



  var runSequence = function(nodes, env) {
    if(nodes.length === 0) {
      return env;
    }
    else {
      return runSequence(_.rest(nodes), interpret(_.first(nodes), rmRet(env)));
    }
  }

  var instantiateType = function(typeFn, identifier) {
    var value = typeFn();
    value._meta = { type: identifier };
    return value;
  }

  var rmRet = function(env) {
    env.ret = null;
    return env;
  }

  var nreturn = function(ctx, ret) {
    if(ret === undefined) {
      return { ctx: ctx, ret: null };
    }
    else {
      return { ctx: ctx, ret: ret };
    }
  }

  this.resolve = resolve;
  this.interpret = interpret;
}).call(this);
