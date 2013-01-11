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
      write: {
        fn: function(env, param) {
          if(Isla.Utils.type(param) === "Object") {
            return param.toString();
          } else {
            return param;
          }
        },

        description: function(p) {
          return "Writes out " + p + ".";
        }
      },

      _types: Isla.Utils.merge(extraTypes, {
        list: function() {
          return new List();
        },

        generic: function() {
          return new Generic();
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

  var Generic = function() {
    this.toString = function(indent) {
      if (!indent) {
        indent = "  ";
      }

      var out = "a " + this._meta.type + "\n";
      for (var i in this) {
        if (Isla.Utils.type(this[i]) !== "Function" && i !== "_meta") {
          if(Isla.Utils.type(this[i]) === "Object") {
            out += indent + i + " is " + this[i].toString(indent + "  ");
          } else {
            out += indent + i + " is '" + this[i] + "'\n";
          }
        }
      }

      return out;
    }
  };

  var objsEqual = function(a, b) {
    // can't check for dupes where one resolved and other ref - haven't got env
    return (a.ref === b.ref && a.ref) || // same ref
      a === b; // same resolved obj
  }

  var List = function() {
    var data = [];

    this.add = multimethod()
      .dispatch(function(thing) {
        return Isla.Utils.type(thing);
      })

      // note: will always be refs unless part of list that is being resolved
      .when("Object", function(thing) {
        for(var i = 0; i < data.length; i++) {
          if (objsEqual(thing, data[i])) {
            return;
          }
        }

        data.push(thing);
      })

      .default(function(thing) {
        data.push(thing);
      })

    this.take = multimethod()
      .dispatch(function(thing) {
        return Isla.Utils.type(thing);
      })

      // note: will always be refs unless part of list that is being resolved
      .when("Object", function(thing) {
        // can't reject dupes where one resolved other ref - haven't got env
        for(var i = 0; i < data.length; i++) {
          if (objsEqual(thing, data[i])) {
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

    this.toString = function(indent) {
      if (!indent) {
        indent = "  ";
      }

      if (this.items().length === 0) {
        return "an empty list"
      } else {
        var out = "a list\n"
        for (var i = 0; i < this.items().length; i++) {
          if(Isla.Utils.type(this.items()[i]) === "Object") {
            out += indent + this.items()[i].toString(indent + "  ");
          } else {
            out += indent + "'" + this.items()[i] + "'\n";
          }
        }

        return out;
      }
    }
  }

  exports.Library.List = List;
})(typeof exports === 'undefined' ? this.Isla : exports);
