/*
  Library
  Defines the Isla built in library of functions and types.
*/

;(function() {
  var _ = require("Underscore");
  var multimethod = require('multimethod');

  var utils = require('./utils');

  this.getInitialEnv = function(extraTypes, initialCtx) {
    var islaCtx = {
      write: function(env, param) {
        var out = param;
        if(utils.type(param) === "Object") {
          out = JSON.stringify(param);
        }

        return out;
      },

      types: utils.merge(extraTypes, {
        list: function() {
          return new IslaList();
        },
        generic: function() {
          return {};
        }
      })
    };

    if(initialCtx !== undefined) {
      islaCtx = utils.merge(islaCtx, initialCtx);
    }

    return {
      ret: null,
      ctx: islaCtx
    };
  };

  var IslaList = function() {
    var data = [];

    this.add = multimethod()
      .dispatch(function(thing) {
        return utils.type(thing);
      })

      .when("Object", function(thing) { // note: will always be refs
        for(var i = 0; i < data.length; i++) {
          if(thing.ref === data[i].ref) {
            return;
          }
        }
        data.push(thing);
      })

      .default(function(thing) {
        data.push(thing);
      })

    this.remove = multimethod()
      .dispatch(function(thing) {
        return utils.type(thing);
      })

      .when("Object", function(thing) { // note: will always be refs
        for(var i = 0; i < data.length; i++) {
          if(thing.ref === data[i].ref) {
            data.splice(i, 1);
            break;
          }
        }
      })

      .default(function(thing) {
        for(var i = 0; i < data.length; i++) {
          if(thing === data[i]) {
            data.splice(i, 1);
            break;
          }
        }
      })

    this.items = function() {
      return data;
    };
  }

  this.IslaList = IslaList;
}).call(this);
