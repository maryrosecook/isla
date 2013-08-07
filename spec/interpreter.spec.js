var parser = require('../src/parser').Parser;
var interpreter = require('../src/interpreter').Interpreter;
var library = require('../src/library').Library;

var newObj = function(type, data) {
  var obj = {
    _meta: { type: type },
    constructor: library.Generic,
    clone: library.Generic.prototype.clone,
  };
  for(var i in data) {
    obj[i] = data[i];
  }

  return obj;
};

describe('interpreter', function() {
  describe('evaluateValue', function(){
    it('should evaluate literal', function() {
      var value = parser.extract(parser.parse("a is '1'"), "root", 0, "block", 0,
                                 "expression", 0, "value_assignment", 2, "value", 0);
      expect(interpreter.evaluateValue(value, {})).toEqual('1');
    });

    it('should evaluate variable', function() {
      var assignee = parser.extract(parser.parse("a is '1'"), "root", 0, "block", 0,
                                    "expression", 0, "value_assignment", 0, "assignee", 0);
      expect(interpreter.evaluateValue(assignee, { ctx:{ a:'1' }})).toEqual('1');
    });

    it('should throw if no var', function() {
      var assignee = parser.extract(parser.parse("a is '1'"), "root", 0, "block", 0,
                                    "expression", 0, "value_assignment", 0, "assignee", 0);
      expect(function() {
        interpreter.evaluateValue(assignee, { ctx:{}})
      }).toThrow('I have not heard of a.');
    });

    it('should evaluate fn name', function() {
      var fn = parser.extract(parser.parse("write 'a'"), "root", 0, "block", 0,
                              "expression", 0, "invocation", 0);
      expect(interpreter.evaluateValue(fn, { ctx: { write:'' }})).toEqual('');
    });

    it('should throw if no fn', function() {
      var fn = parser.extract(parser.parse("write 'a'"), "root", 0, "block", 0,
                              "expression", 0, "invocation", 0);
      expect(function() {
        interpreter.evaluateValue(fn, { ctx:{}})
      }).toThrow('I have not heard of write.');
    });
  });

  describe('references', function(){
    it('should produce right data if follow scalar ref made before obj updated', function() {
      var code = "isla is a person\nfriend is isla\nisla age is '1'";
      var env = interpreter.interpret(code);
      expect(env.ctx.friend.age).toEqual('1');
    });

    it('should produce right data if follow attr made before obj updated', function() {
      var code = "isla is a person\nmary is a person\nmary friend is isla\nisla age is '1'";
      var env = interpreter.interpret(code);
      expect(env.ctx.mary.friend.age).toEqual('1');
    });

    it('should update original when ref attr changed', function() {
      var code = "mary is a person\na is mary\na age is '1'";
      var env = interpreter.interpret(code);
      expect(env.ctx.mary.age).toEqual('1');
      expect(env.ctx.a.age).toEqual('1');
    });
  });

  describe('assignment, references and object types', function(){
    describe('scalars', function(){
      it('should copy by value when string assigned', function() {
        var code = "a is '1'\nb is a\na is '2'";
        var env = interpreter.interpret(code);
        expect(env.ctx.a).toEqual("2");
        expect(env.ctx.b).toEqual("1");
      });

      it('should use ref when obj assigned', function() {
        var code = "mary is a person\na is mary\nb is mary\na age is '1'";
        var env = interpreter.interpret(code);
        expect(env.ctx.a.age).toEqual('1');
        expect(env.ctx.b.age).toEqual('1');
      });
    });

    describe('non-existent', function(){
      it('should complain about non-existent top level assignee obj', function() {
        expect(function() {
          interpreter.interpret("a b is '1'");
        }).toThrow("I have not heard of a.");
      });

      it('should complain about non-existent obj that is attr of obj', function() {
        expect(function() {
          interpreter.interpret("a is a thing\na b c is '1'");
        }).toThrow("I have not heard of a b.");
      });

      it('should complain if try to assign attribute of primitive', function() {
        expect(function() {
          interpreter.interpret("a is '1'\na b is '2'");
        }).toThrow("a can not have b.");
      });

      it('should complain about non-existent assigned top level thing', function() {
        expect(function() {
          interpreter.interpret("a is b");
        }).toThrow("I have not heard of b.");
      });

      it('should complain about attr of obj attr of non-existent assigned obj', function() {
        expect(function() {
          interpreter.interpret("a is b c d");
        }).toThrow("I have not heard of b.");
      });
    });


    describe('nested attributes', function(){
      it('should be able to assign scalar to nested attr', function() {
        var code = "x is a thing\nx y is a thing\nx y z is '1'";
        var env = interpreter.interpret(code);
        expect(env.ctx.x.y.z).toEqual('1');
      });
    });


    describe('nested attributes', function(){
      it('should be able to assign nested attr to scalar', function() {
        var code = "x is a thing\nx y is a thing\nx y z is '1'\na is x y z";
        var env = interpreter.interpret(code);
        expect(env.ctx.a).toEqual('1');
      });
    });

    describe('object attribute assigned to scalar', function(){
      it('should copy when obj primitive obj attr assigned', function() {
        var code = "x is a person\nx age is '1'\ny is x age\nx age is '2'";
        var env = interpreter.interpret(code);
        expect(env.ctx.x.age).toEqual('2');
        expect(env.ctx.y).toEqual('1');
      });
    });

    describe('object attribute assigned to object attribute', function(){
      it('should copy when obj primitive obj attr assigned', function() {
        var code = "x is a person\ny is a person\nx age is '1'\ny age is x age\nx age is '2'";
        var env = interpreter.interpret(code);
        expect(env.ctx.x.age).toEqual('2');
        expect(env.ctx.y.age).toEqual('1');
      });
    });
  });

  describe('invocation', function(){
    it('should return result of invocation', function() {
      var env = interpreter.interpret("write '2'");
      expect(env.ret).toEqual('2\n');
    });

    it('should return result of last invocation', function() {
      var env = interpreter.interpret("write '2'\nwrite '3'");
      expect(env.ret).toEqual('3\n');
    });

    it('should return null if expression does not return anything', function() {
      var env = interpreter.interpret("write '2222'\nage is '1222'");
      expect(env.ret).toEqual(null);
    });

    it('should accept scalar as param', function() {
      var env = interpreter.interpret("age is '1'\nwrite age");
      expect(env.ret).toEqual('1\n');
    });

    it('should accept object attribute as param', function() {
      var code = "mary is a person\nmary age is '2'\nwrite mary age";
      var env = interpreter.interpret(code);
      expect(env.ret).toEqual('2\n');
    });
  });

  describe('type assignment', function(){
    it('should be able to make generic type', function() {
      var env = interpreter.interpret("isla is a person");
      expect(env.ctx.isla).toEqual(newObj("person"));
    });
  });

  describe('slot assignment', function(){
    it('should be able to assign value to slot', function() {
      var env = interpreter.interpret("isla is a person\nisla age is '1'");
      expect(env.ctx.isla.age).toEqual('1');
    });

    it('should be able to assign value to slot and retain other slot vals', function() {
      var code = "isla is a person\nisla name is 'isla'\nisla age is '1'";
      var env = interpreter.interpret(code);
      expect(env.ctx.isla.name).toEqual("isla");
    });

    it('should be able to assign slot with obj instantiation', function() {
      var code = "isla is a person\nisla friend is a person";
      var env = interpreter.interpret(code);
      expect(env.ctx.isla.friend).toEqual(newObj("person"));
    });
  });

  describe('lists', function() {
    describe('instantiation', function(){
      it('should be able to instantiate a list', function() {
        var env = interpreter.interpret("items is a list");
        expect(env.ctx.items.items()).toEqual([]);
      });
    });

    describe('non existent', function(){
      it('should get error if try and use non-existent list', function() {
        expect(function(){
          interpreter.interpret("add 'sword' to items");
        }).toThrow("I have not heard of items.");
      });
    });

    describe('addition', function() {
      it('should be able to add string to a list', function() {
        var env = interpreter.interpret("items is a list\nadd 'sword' to items");
        expect(env.ctx.items.items()).toEqual(["sword"]);
      });

      it('should be able to add ref to a list', function() {
        var code = "items is a list\nmary is a person\nadd mary to items";
        var env = interpreter.interpret(code);
        expect(env.ctx.items.items()[0]._meta.type).toEqual("person");
      });

      it('should be able to add scalar attr of obj that is attr of obj to a list', function() {
        var code = "i is a list\na is a thing\na b is a thing\na b c is '1'\nadd a b c to i";
        var env = interpreter.interpret(code);
        expect(env.ctx.i.items()).toEqual(['1']);
      });


      it('should be able to add obj attr of obj that is attr of obj to a list', function() {
        var code = "i is a list\na is a thing\na b is a thing\na b c is a thing\nadd a b c to i";
        var env = interpreter.interpret(code);
        expect(env.ctx.i.items()[0]._meta.type).toEqual("thing");
      });


      it('should be able to add to list that is attr of obj that is attr of obj', function() {
        var code = "a is a thing\na b is a thing\na b c is a list\nadd '1' to a b c";
        var env = interpreter.interpret(code);
        expect(env.ctx.a.b.c.items()).toEqual(['1']);
      });


      it('should not mistake two objects w/o refs as identical', function() {
        // here because object equality check was a.ref === b.ref
        // before you could add resolved objs to Lists
        var code = "a is a person\nb is a person\nb age is '1'\na friend is b";
        var env = interpreter.interpret(code);

        var list = new library.List();
        list.add(env.ctx.a.friend, env);
        expect(list.items().length).toEqual(1);
        list.add(env.ctx.a, env);
        expect(list.items().length).toEqual(2);
      });

      it('should not be able to add same obj to a list twice', function() {
        var code = "a is a person\nb is a person\nb age is '1'\na friend is b";
        var env = interpreter.interpret(code);

        var list = new library.List();
        list.add(env.ctx.a.friend, env);
        list.add(env.ctx.a.friend, env);

        expect(list.items()[0].age).toEqual('1');
        expect(list.items().length).toEqual(1);
      });

      it('should be able to add dupe string to list', function() {
        var code = "items is a list\nadd 'sword' to items\nadd 'sword' to items";
        var env = interpreter.interpret(code);
        expect(env.ctx.items.items()).toEqual(["sword", "sword"]);
      });

      it('should be able to add item to list that is an attr', function() {
        var code = "isla is a person\nisla items is a list\nadd '1' to isla items";
        var env = interpreter.interpret(code);
        expect(env.ctx.isla.items.items()).toEqual(['1']);
      });

      it('should add canonical version of item to list', function() {
        var code = "i is a list\na is '1'\nm is a q\nm n is a\nadd m n to i";
        var env = interpreter.interpret(code);
        expect(env.ctx.i.items()).toEqual(['1']);
      });
    });

    describe('removal', function() {
      it('should be able to take string from a list', function() {
        var code = "items is a list\nadd 'sword' to items\ntake 'sword' from items";
        var env = interpreter.interpret(code);
        expect(env.ctx.items.items()).toEqual([]);
      });

      it('should be able to take ref from a list', function() {
        var code = "items is a list\nmary is a person\nadd mary to items\ntake mary from items";
        var env = interpreter.interpret(code);
        expect(env.ctx.items.items()).toEqual([]);
      });

      it('should not mistake two objects w/o refs as identical', function() {
        // here because object equality check was a.ref === b.ref
        // before you could add resolved objs to Lists
        var code = "a is a person\nb is a person\nb age is '1'\na friend is b";
        var env = interpreter.interpret(code);

        var list = new library.List();
        list.add(env.ctx.a.friend, env);
        expect(list.items().length).toEqual(1);
        list.take(env.ctx.a, env);
        expect(list.items().length).toEqual(1);
      });

      it('should do nothing if try to take non-existent string from list', function() {
        var code = "items is a list\nadd 'a' to items\ntake 'b' from items";
        var env = interpreter.interpret(code);
        expect(env.ctx.items.items()).toEqual(["a"]);
      });

      it('should do nothing if try to take non-existent obj from list', function() {
        var code = "mary is a person\nmary age is '1'\nisla is a person\nitems is a list\nadd isla to items\nadd mary to items\ntake mary from items";
        var env = interpreter.interpret(code);
        expect(env.ctx.items.items()).toEqual([newObj("person")]);
      });
    });
  });
});
