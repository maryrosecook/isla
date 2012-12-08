/*
  Library
  Defines the Isla built in library of functions and types.
*/

;(function(exports) {
  var Isla, _, multimethod;
  if(typeof module !== 'undefined' && module.exports) { // node
    _ = require("Underscore");
    multimethod = require('multimethod');
    Isla = {};
    Isla.Utils = require('./utils').Utils;
  } else { // browser
    _ = window._;
    multimethod = window.multimethod;
    Isla = window.Isla;
  }

  exports.Library = {};

  exports.Library.getInitialEnv = function(extraTypes, initialCtx) {
    var islaCtx = {
      write: function(env, param) {
        var out = param;
        if(Isla.Utils.type(param) === "Object") {
          out = JSON.stringify(param);
        }

        return out;
      },

      types: Isla.Utils.merge(extraTypes, {
        list: function() {
          return new IslaList();
        },

        generic: function() {
          return {};
        }
      })
    };

    if(initialCtx !== undefined) {
      islaCtx = Isla.Utils.merge(islaCtx, initialCtx);
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
        return Isla.Utils.type(thing);
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
        return Isla.Utils.type(thing);
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

  exports.Library.IslaList = IslaList;
})(typeof exports === 'undefined' ? this.Isla : exports);
