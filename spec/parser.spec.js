var _ = require('Underscore');
var multimethod = require('multimethod');

var parser = require('../src/parser').Parser;
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
  describe('assignment to scalar', function(){
    it('should assign an identifier', function() {
      checkAst(parser.parse("isla is age"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{scalar: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{variable:
                                              [{scalar: [{identifier: ["age"]}]}]}]}]}]}]}]});
    });

    it('should assign a string in single quotes', function() {
      checkAst(parser.parse("isla is 'cool'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{scalar: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ["cool"]}]}]}]}]}]}]});
    });

    it('should assign a string in double quotes', function() {
      checkAst(parser.parse("isla is \"cool\""),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{scalar: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ["cool"]}]}]}]}]}]}]});
    });

    it('should not parse assignment of int', function() {
      expect(function(){
        parser.parse("age is 1");
      }).toThrow();
    });
  });

  describe('assignment to object attribute', function(){
    it('should allow assignment', function() {
      checkAst(parser.parse("isla age is '1'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{object:
                                                 [{identifier: ["isla"]},
                                                  {identifier: ["age"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['1']}]}]}]}]}]}]});
    });
  });

  describe('type assignment', function(){
    it('should allow assignment to scalar', function() {
      checkAst(parser.parse("mary is a girl"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{scalar: [{identifier: ["mary"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["girl"]}]}]}]}]});
    });

    it('should allow assignment to an object attribute', function() {
      checkAst(parser.parse("mary friend is a girl"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{object:
                                                 [{identifier: ["mary"]},
                                                  {identifier: ["friend"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["girl"]}]}]}]}]});
    });
  });

  describe('blocks', function(){
    it('should allow a two expression block', function() {
      checkAst(parser.parse("isla is '1'\nmary is '2'"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{scalar: [{identifier: ["isla"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['1']}]}]}]}]},
                                {expression:
                                 [{value_assignment:
                                   [{assignee: [{scalar: [{identifier: ["mary"]}]}]},
                                    {is: ["is"]},
                                    {value: [{literal: [{string: ['2']}]}]}]}]}]}]});
    });

    it('should allow a three expression block', function() {
      checkAst(parser.parse("name is 'Isla'\nwrite 'la'\nwrite name"),
               {root: [{block: [{expression:
                                 [{value_assignment:
                                   [{assignee: [{scalar: [{identifier: ["name"]}]}]},
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
                                              [{scalar: [{identifier: ["name"]}]}]}]}]}]}
                                ]}]});
    });
  });

  describe('whitespace', function() {
    it('should allow whitespace at end of expressions', function() {
      expect(parser.parse("x is y          ").tag).toEqual("root");
      expect(parser.parse("write x         ").tag).toEqual("root");
      expect(parser.parse("add x to y      ").tag).toEqual("root");
      expect(parser.parse("x is a y        ").tag).toEqual("root");
    });

    it('should allow whitespace at beginning of expressions', function() {
      expect(parser.parse("   x is y").tag).toEqual("root");
      expect(parser.parse("   write x").tag).toEqual("root");
      expect(parser.parse("   add x to y").tag).toEqual("root");
      expect(parser.parse("   x is a y").tag).toEqual("root");
    });

    it('should allow whitespace at in middle of expressions', function() {
      expect(parser.parse("x   is y").tag).toEqual("root");
      expect(parser.parse("write    x").tag).toEqual("root");
      expect(parser.parse("add x   to y").tag).toEqual("root");
      expect(parser.parse("x is   a y").tag).toEqual("root");
    });
  });

  describe('invocation', function() {
    it('should not parse invocation with int param', function() {
      expect(function(){
        parser.parse("write 1");
      }).toThrow();
    });

    it('should allow invocation with scalar variable', function() {
      checkAst(parser.parse("write isla"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{variable:
                                              [{scalar: [{identifier: ["isla"]}]}]}]}]}]}]}]});
    });

    it('should allow invocation with scalar literal', function() {
      checkAst(parser.parse("write 'isla'"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{literal: [{string: ["isla"]}]}]}]}]}]}]});
    });

    it('should allow invocation with object attribute', function() {
      checkAst(parser.parse("write isla age"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{variable:
                                              [{object: [{identifier: ["isla"]},
                                                         {identifier: ["age"]}]}]}]}]}]}]}]});
    });

    it('should not show string regression', function() {
      checkAst(parser.parse("write 'My name Isla'"),
               {root: [{block: [{expression:
                                 [{invocation:
                                   [{identifier: ["write"]},
                                    {value: [{literal:
                                              [{string: ["My name Isla"]}]}]}]}]}]}]});
    });
  });

  describe('lists', function() {
    it('should allow list instantiation', function() {
      checkAst(parser.parse("items is a list"),
               {root: [{block: [{expression:
                                 [{type_assignment:
                                   [{assignee: [{scalar: [{identifier: ["items"]}]}]},
                                    {is_a: ["is a"]},
                                    {identifier: ["list"]}]}]}]}]});

    });

    it('should not allow addition of int to list', function() {
      expect(function(){
        parser.parse("add 1 to list");
      }).toThrow();
    });

    it('should allow addition of item to list', function() {
      checkAst(parser.parse("add sword to items"),
               {root: [{block: [{expression:
                                 [{list_assignment:
                                   [{list_operation: [{add: ["add"]}]},
                                    {value: [{variable:
                                              [{scalar:
                                                [{identifier: ["sword"]}]}]}]},
                                    {to_from: ["to from"]},
                                    {assignee: [{scalar: [{identifier: ["items"]}]}]}]}]}]}]})
    });
  });

  describe('syntax annotation', function() {
    var astExpression = function(code) {
      return parser.extract(parser.parse(code),
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
          expect(parser.extract(astExpression("x is 'y'"),
                                0, "assignee", 0).syntax).toEqual("variable");
        });

        it('should annotate in object assignment', function() {
          expect(parser.extract(astExpression("x y is 'z'"),
                                0, "assignee", 0, "object", 0).syntax)
          .toEqual("variable");
        });
      });

      describe('type instantiations', function() {
        it('should annotate in scalar type instantiation', function() {
          expect(parser.extract(astExpression("x is a y"),
                                0, "assignee", 0).syntax).toEqual("variable");
        });

        it('should annotate in an attribute type instantiation', function() {
          expect(parser.extract(astExpression("x y is a z"),
                                0, "assignee", 0, "object", 0).syntax)
          .toEqual("variable");
        });
      });

      describe('list operations', function() {
        it('should annotate item in a list operation', function() {
          expect(parser.extract(astExpression("add x to y"),
                                1, "value", 0, "variable", 0).syntax)
          .toEqual("variable");
        });

        it('should annotate list in a list operation', function() {
          expect(parser.extract(astExpression("add x to y"),
                                3, "assignee", 0).syntax).toEqual("variable");
        });
      });

      describe('invocations', function() {
        it('should annotate scalar param', function() {
          expect(parser.extract(astExpression("write x"),
                                1, "value", 0, "variable", 0).syntax)
          .toEqual("variable");
        });

        it('should annotate in object param', function() {
          expect(parser.extract(astExpression("write x y"),
                                1, "value", 0, "variable", 0, "object", 0).syntax)
          .toEqual("variable");
        });
      });
    });

    describe('function identifiers', function() {
      describe('invocations', function() {
        it('should annotate in invocation', function() {
          expect(parser.extract(astExpression("write x"),
                                0).syntax).toEqual("function");
        });

      });
    });

    describe('literals', function() {
      describe('assignments', function() {
        it('should annotate in assignment', function() {
          expect(parser.extract(astExpression("x is 'y'"),
                                2, "value", 0).syntax).toEqual("literal");
        });
      });

      describe('list operations', function() {
        it('should annotate item in a list operation', function() {
          expect(parser.extract(astExpression("add 'x' to y"),
                                1, "value", 0).syntax).toEqual("literal");
        });
      });

      describe('invocations', function() {
        it('should annotate scalar param', function() {
          expect(parser.extract(astExpression("write 'x'"),
                                1, "value", 0).syntax).toEqual("literal");
        });
      });
    });

    describe('attributes', function() {
      describe('assignments', function() {
        it('should annotate in object assignment', function() {
          expect(parser.extract(astExpression("x y is 'z'"),
                                0, "assignee", 0, "object", 1).syntax)
          .toEqual("attribute");
        });
      });

      describe('type instantiations', function() {
        it('should annotate in an attribute type instantiation', function() {
          expect(parser.extract(astExpression("x y is a z"),
                                0, "assignee", 0, "object", 1).syntax)
          .toEqual("attribute");
        });
      });

      describe('list operations', function() {
        it('should annotate is a list op on a obj attribute', function() {
          expect(parser.extract(astExpression("add x to y z"),
                                3, "assignee", 0, "object", 1).syntax)
          .toEqual("attribute");
        });
      });

      describe('invocations', function() {
        it('should annotate in object param', function() {
          expect(parser.extract(astExpression("write x y"),
                                1, "value", 0, "variable", 0, "object", 1).syntax)
          .toEqual("attribute");
        });
      });
    });
  });
});
