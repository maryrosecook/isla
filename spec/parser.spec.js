var _ = require('Underscore');
var multimethod = require('multimethod');

var p = require('../src/parser').Parser;
var utils = require("../src/utils").Utils;

var checkAst = multimethod()
  .dispatch(function(actual, _) {
    return utils.type(actual);
  })
  .when("Array", function(actual, expected) {
    expect(actual.length).toEqual(expected.length);
    _.map(_.zip(actual, expected), function(pair) {
      checkAst(pair[0], pair[1]);
    })
  })
  .when("Object", function(actual, expected) {
    expect(actual.tag).toEqual(_.keys(expected)[0]);
    checkAst(actual.c, _.values(expected)[0]);
  })
  .default(function(actual, expected) {
    expect(actual).toEqual(expected);
  });

describe('parser', function() {
  describe('find', function() {
    it('should find node when is the node initially passed in', function() {
      expect(p.find(p.parse("x y is '1'"), "root").tag).toEqual("root");
    });

    it('should find node when is a couple of layers down', function() {
      expect(p.find(p.parse("x y is '1'"), "expression").tag).toEqual("expression");
    });

    it('should find node that is a leaf', function() {
      expect(p.find(p.parse("x y is '1'"), "string").c[0]).toEqual('1');
    });

    it('should find node for which there are other versions elsewhere', function() {
      expect(p.find(p.find(p.parse("x y is m n"), "variable").c[0].c[0])).toEqual('x');
    });

    it('should find node when it is not the first token in an array', function() {
      expect(p.find(p.parse("x y is '1'"), "value").tag).toEqual("value");
    });

    it('should return undefined when no node tagged with passed tag', function() {
      expect(p.find(p.parse("x y is '1'"), "hellno")).toBeUndefined();
    });
  });

  describe('assignment to scalar', function(){
    it('should assign an identifier', function() {
      checkAst(p.parse("isla is age"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{variable:
                                              [{identifier: ["age"]}]}]}]}]}]}]});
    });

    it('should assign a string in single quotes', function() {
      checkAst(p.parse("isla is 'cool'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ["cool"]}]}]}]}]}]}]});
    });

    it('should assign a string in double quotes', function() {
      checkAst(p.parse("isla is \"cool\""),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ["cool"]}]}]}]}]}]}]});
    });

    it('should not parse assignment of int', function() {
      expect(function(){
        p.parse("age is 1");
      }).toThrow();
    });
  });

  describe('assignment to object attribute', function(){
    it('should allow assignment', function() {
      checkAst(p.parse("isla age is '1'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable:
                                                 [{identifier: ["isla"]},
                                                  {identifier: ["age"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['1']}]}]}]}]}]}]});
    });

    it('should allow assignment to several attrs deep', function() {
      checkAst(p.parse("isla jacket sleeve color is 'red'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable:
                                                 [{identifier: ["isla"]},
                                                  {identifier: ["jacket"]},
                                                  {identifier: ["sleeve"]},
                                                  {identifier: ["color"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['red']}]}]}]}]}]}]});
    });
  });

  describe('assignment of nested object attribute', function(){
    it('should allow assignment', function() {
      checkAst(p.parse("color is isla jacket sleeve color"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["color"]}]}]},
                                    {is: ["is"]},
                                    {value: [{variable:
                                              [{identifier: ["isla"]},
                                               {identifier: ["jacket"]},
                                               {identifier: ["sleeve"]},
                                               {identifier: ["color"]}]}]}]}]}]}]});
    });
  });

  describe('type assignment', function(){
    it('should allow assignment to scalar', function() {
      checkAst(p.parse("mary is a girl"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{variable: [{identifier: ["mary"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["girl"]}]}]}]}]});
    });

    it('should allow assignment to an object attribute', function() {
      checkAst(p.parse("mary friend is a girl"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{variable:
                                                 [{identifier: ["mary"]},
                                                  {identifier: ["friend"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["girl"]}]}]}]}]});
    });

    it('should allow assignment to an nested object attribute', function() {
      checkAst(p.parse("mary friend niece is a girl"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{variable:
                                                 [{identifier: ["mary"]},
                                                  {identifier: ["friend"]},
                                                  {identifier: ["niece"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["girl"]}]}]}]}]});
    });
  });

  describe('blocks', function(){
    it('should allow a two expression block', function() {
      checkAst(p.parse("isla is '1'\nmary is '2'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['1']}]}]}]}]},
                                {expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["mary"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['2']}]}]}]}]}]}]});
    });

    it('should allow a three expression block', function() {
      checkAst(p.parse("name is 'Isla'\nwrite 'la'\nwrite name"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{variable: [{identifier: ["name"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ["Isla"]}]}]}]}]},
                                {expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{literal: [{string: ["la"]}]}]}]}]},
                                {expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{variable:
                                              [{identifier: ["name"]}]}]}]}]}
                                ]}]});
    });
  });

  describe('whitespace', function() {
    it('should allow whitespace at end of expressions', function() {
      expect(p.parse("x is y          ").tag).toEqual("root");
      expect(p.parse("write x         ").tag).toEqual("root");
      expect(p.parse("add x to y      ").tag).toEqual("root");
      expect(p.parse("x is a y        ").tag).toEqual("root");
    });

    it('should allow whitespace at beginning of expressions', function() {
      expect(p.parse("   x is y").tag).toEqual("root");
      expect(p.parse("   write x").tag).toEqual("root");
      expect(p.parse("   add x to y").tag).toEqual("root");
      expect(p.parse("   x is a y").tag).toEqual("root");
    });

    it('should allow whitespace at in middle of expressions', function() {
      expect(p.parse("x   is y").tag).toEqual("root");
      expect(p.parse("write    x").tag).toEqual("root");
      expect(p.parse("add x   to y").tag).toEqual("root");
      expect(p.parse("x is   a y").tag).toEqual("root");
    });
  });

  describe('index of node in source', function() {
    var expr = function(ast) {
      return p.extract(ast, "root", 0, "block", 0, "expression", 0);
    };

    it('should set index of 0 for beginning of expression', function() {
      expect(expr(p.parse("x is y")).index).toEqual(0);
    });

    it('should set index of 0 for assignee at beginning of expression', function() {
      var e = expr(p.parse("x is y"));
      expect(p.extract(e, "value_assignment", 0).index).toEqual(0);
    });

    it('should set index of 2 for is in expression', function() {
      var e = expr(p.parse("x is y"));
      expect(p.extract(e, "value_assignment", 1).index).toEqual(2);
    });

    it('should set correct col when whitespace in code', function() {
      var e = expr(p.parse("x           is y"));
      expect(p.extract(e, "value_assignment", 1).index).toEqual(12);
    });
  });

  describe('invocation', function() {
    it('should not parse invocation with int param', function() {
      expect(function(){
        p.parse("write 1");
      }).toThrow();
    });

    it('should allow invocation with scalar variable', function() {
      checkAst(p.parse("write isla"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{variable:
                                              [{identifier: ["isla"]}]}]}]}]}]}]});
    });

    it('should allow invocation with scalar literal', function() {
      checkAst(p.parse("write 'isla'"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{literal: [{string: ["isla"]}]}]}]}]}]}]});
    });

    it('should allow invocation with object attribute', function() {
      checkAst(p.parse("write isla age"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{variable:
                                              [{identifier: ["isla"]},
                                               {identifier: ["age"]}]}]}]}]}]}]});
    });

    it('should allow invocation with nested object attribute', function() {
      checkAst(p.parse("write isla jacket sleeve color"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{variable:
                                              [{identifier: ["isla"]},
                                               {identifier: ["jacket"]},
                                               {identifier: ["sleeve"]},
                                               {identifier: ["color"]}]}]}]}]}]}]});
    });

    it('should not show string regression', function() {
      checkAst(p.parse("write 'My name Isla'"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{literal:
                                              [{string: ["My name Isla"]}]}]}]}]}]}]});
    });
  });

  describe('lists', function() {
    it('should allow list instantiation', function() {
      checkAst(p.parse("items is a list"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{variable: [{identifier: ["items"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["list"]}]}]}]}]});

    });

    it('should not allow addition of int to list', function() {
      expect(function(){
        p.parse("add 1 to list");
      }).toThrow();
    });

    it('should allow addition of item to list', function() {
      checkAst(p.parse("add sword to items"),
               {root: [{block: [{expression:
                                 [{list_assignment:
                                   [{list_operation: [{add: ["add"]}]},
                                    {value: [{variable:
                                              [{identifier: ["sword"]}]}]},
                                    {to_from: ["to from"]},
                                    {assignee: [{variable: [{identifier: ["items"]}]}]}]}]}]}]})
    });
  });

  describe('syntax annotation', function() {
    var astExpression = function(code) {
      return p.extract(p.parse(code),
                            "root", 0, "block", 0, "expression", 0).c;
    };

    describe('keywords', function() {
      describe('assignments', function() {
        it('should annotate is in scalar assignment', function() {
          expect(astExpression("x is 'y'")[1].syntax).toEqual("keyword");
        });

        it('should annotate is in object assignment', function() {
          expect(astExpression("x y is 'z'")[1].syntax).toEqual("keyword");
        });
      });

      describe('type instantiations', function() {
        it('should annotate is a in scalar type instantiation', function() {
          expect(astExpression("x is a y")[1].syntax).toEqual("keyword");
        });

        it('should annotate is a in an attribute type instantiation', function() {
          expect(astExpression("x y is a z")[1].syntax).toEqual("keyword");
        });
      });

      describe('list operations', function() {
        it('should annotate add in a list operation', function() {
          expect(astExpression("add x to y")[0].c[0].syntax).toEqual("keyword");
        });

        it('should annotate to in a list operation', function() {
          expect(astExpression("add x to y")[2].syntax).toEqual("keyword");
        });

        it('should annotate take in a list operation', function() {
          expect(astExpression("take x from y")[0].c[0].syntax).toEqual("keyword");
        });

        it('should annotate from in a list operation', function() {
          expect(astExpression("take x from y")[2].syntax).toEqual("keyword");
        });
      });
    });

    describe('types', function() {
      describe('type instantiations', function() {
        it('should annotate in scalar type instantiation', function() {
          expect(astExpression("x is a y")[2].syntax).toEqual("type");
        });

        it('should annotate in an attribute type instantiation', function() {
          expect(astExpression("x y is a z")[2].syntax).toEqual("type");
        });
      });
    });

    describe('variables', function() {
      describe('assignments', function() {
        it('should annotate in scalar assignment', function() {
          expect(p.extract(astExpression("x is 'y'"),
                                0, "assignee", 0, "variable", 0).syntax).toEqual("variable");
        });

        it('should annotate in object assignment', function() {
          expect(p.extract(astExpression("x y is 'z'"),
                                0, "assignee", 0, "variable", 0).syntax)
          .toEqual("variable");
        });
      });

      describe('type instantiations', function() {
        it('should annotate in scalar type instantiation', function() {
          expect(p.extract(astExpression("x is a y"),
                                0, "assignee", 0, "variable", 0).syntax).toEqual("variable");
        });

        it('should annotate in an attribute type instantiation', function() {
          expect(p.extract(astExpression("x y is a z"),
                                0, "assignee", 0, "variable", 0).syntax)
          .toEqual("variable");
        });
      });

      describe('list operations', function() {
        it('should annotate item in a list operation', function() {
          expect(p.extract(astExpression("add x to y"),
                                1, "value", 0, "variable", 0).syntax)
          .toEqual("variable");
        });

        it('should annotate list in a list operation', function() {
          expect(p.extract(astExpression("add x to y"),
                                3, "assignee", 0, "variable", 0).syntax).toEqual("variable");
        });
      });

      describe('invocations', function() {
        it('should annotate scalar param', function() {
          expect(p.extract(astExpression("write x"),
                                1, "value", 0, "variable", 0).syntax)
          .toEqual("variable");
        });

        it('should annotate in object param', function() {
          expect(p.extract(astExpression("write x y"),
                                1, "value", 0, "variable", 0).syntax)
          .toEqual("variable");
        });
      });
    });

    describe('function identifiers', function() {
      describe('invocations', function() {
        it('should annotate in invocation', function() {
          expect(p.extract(astExpression("write x"),
                                0).syntax).toEqual("function");
        });

      });
    });

    describe('literals', function() {
      describe('assignments', function() {
        it('should annotate in assignment', function() {
          expect(p.extract(astExpression("x is 'y'"),
                                2, "value", 0).syntax).toEqual("literal");
        });
      });

      describe('list operations', function() {
        it('should annotate item in a list operation', function() {
          expect(p.extract(astExpression("add 'x' to y"),
                                1, "value", 0).syntax).toEqual("literal");
        });
      });

      describe('invocations', function() {
        it('should annotate scalar param', function() {
          expect(p.extract(astExpression("write 'x'"),
                                1, "value", 0).syntax).toEqual("literal");
        });
      });
    });

    describe('identifier', function() {
      it('should allow underscores in identifiers', function() {
        expect(p.extract(astExpression("x _y is 'z'"),
                              0, "assignee", 0, "variable", 1).syntax)
        .toEqual("attribute");
      });
    });

    describe('attributes', function() {
      describe('assignments', function() {
        it('should annotate in object assignment', function() {
          expect(p.extract(astExpression("x y is 'z'"),
                                0, "assignee", 0, "variable", 1).syntax)
          .toEqual("attribute");
        });
      });

      describe('type instantiations', function() {
        it('should annotate in an attribute type instantiation', function() {
          expect(p.extract(astExpression("x y is a z"),
                                0, "assignee", 0, "variable", 1).syntax)
          .toEqual("attribute");
        });
      });

      describe('list operations', function() {
        it('should annotate is a list op on a obj attribute', function() {
          expect(p.extract(astExpression("add x to y z"),
                                3, "assignee", 0, "variable", 1).syntax)
          .toEqual("attribute");
        });
      });

      describe('invocations', function() {
        it('should annotate in object param', function() {
          expect(p.extract(astExpression("write x y"),
                                1, "value", 0, "variable", 1).syntax)
          .toEqual("attribute");
        });
      });
    });
  });
});
