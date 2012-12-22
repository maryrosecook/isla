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
});
