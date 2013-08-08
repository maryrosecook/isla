var interpreter = require('../src/interpreter').Interpreter;
var library = require('../src/library').Library;

describe('library', function() {
  describe('write', function(){
    describe('Generic', function(){
      it('should print attributes', function() {
        var code = "pluto is a planet\npluto density is '3'\npluto radius is '7'\nwrite pluto";
        var env = interpreter.interpret(code);

        expect(env.ret).toEqual("a planet\n  density is '3'\n  radius is '7'\n");
      });

      it('should print attribute that is obj, too', function() {
        var code = "pluto is a planet\nneptune is a planet\nneptune density is '20'\npluto density is '3'\npluto neighbour is neptune\npluto radius is '6'\nwrite pluto";
        var env = interpreter.interpret(code);
        expect(env.ret).toEqual("a planet\n  density is '3'\n  neighbour is a planet\n    density is '20'\n  radius is '6'\n");
      });

      it('should print no attributes if Generic has none', function() {
        var code = "pluto is a planet\nwrite pluto";
        var env = interpreter.interpret(code);
        expect(env.ret).toEqual("a planet\n");
      });
    });

    describe('List', function(){
      it('should print elements of List', function() {
        var code = "l is a list\nadd 'a' to l\nadd 'b' to l\nwrite l";
        var env = interpreter.interpret(code);
        expect(env.ret).toEqual("a list\n  'a'\n  'b'\n");
      });

      it('should print element that is obj, too', function() {
        var code = "l is a list\nneptune is a planet\nneptune density is '1'\nadd '1' to l\nadd neptune to l\nadd '2' to l\nwrite l";
        var env = interpreter.interpret(code);
        expect(env.ret).toEqual("a list\n  '1'\n  a planet\n    density is '1'\n  '2'\n");
      });

      it('should indicate empty list has nothing in it', function() {
        var code = "l is a list\n\nwrite l";
        var env = interpreter.interpret(code);
        expect(env.ret).toEqual("an empty list");
      });
    });

    describe('clone', function() {
      describe('List', function(){
        it('should have two elements in clone that appear in original', function() {
          var l = new library.List();
          l.add("1");
          l.add("2");
          expect(l.clone().items()[0]).toEqual("1");
          expect(l.clone().items()[1]).toEqual("2");
          expect(l.clone() !== l).toEqual(true);
          expect(l.clone().constructor === library.List).toEqual(true);
        });

        it('should clone list inside list', function() {
          var l = new library.List();
          var innerL = new library.List();
          innerL.add("1");
          l.add(innerL);
          expect(l.clone().items()[0].items()[0]).toEqual("1");
          expect(l.clone().items()[0] !== innerL).toEqual(true);
          expect(l.clone().items()[0].constructor === library.List).toEqual(true);
        });

        it('should clone generic inside list', function() {
          var l = new library.List();
          var g = new library.Generic();
          g.la = "1";
          l.add(g);
          expect(l.clone().items()[0].la).toEqual("1");
          expect(l.clone() !== l).toEqual(true);
          expect(l.clone().items()[0].constructor === library.Generic).toEqual(true);
        });
      });

      describe('Generic', function(){
        it('should have two elements in clone that appear in original', function() {
          var g = new library.Generic();
          g.one = "1";
          g.two = "2";
          expect(g.clone().one).toEqual("1");
          expect(g.clone().two).toEqual("2");
          expect(g.clone() !== g).toEqual(true);
          expect(g.clone() instanceof library.Generic).toEqual(true);
        });

        it('should clone a list inside a generic', function() {
          var g = new library.Generic();
          var l = new library.List();
          l.add("1");
          g.l = l;
          expect(g.clone().l.items()[0]).toEqual("1");
          expect(g.clone().l !== l).toEqual(true);
          expect(g.clone().l.constructor === library.List).toEqual(true);
        });

        it('should clone generic inside generic', function() {
          var g = new library.Generic();
          var innerG = new library.Generic();
          innerG.one = "1";
          g.innerG = innerG;
          expect(g.clone().innerG.one).toEqual("1");
          expect(g.clone().innerG !== innerG).toEqual(true);
          expect(g.clone().innerG.constructor === library.Generic).toEqual(true);
        });
      });

      describe('env', function(){
        it('should copy string ret', function() {
          var e = library.getInitialEnv()
          e.ret = "1";
          expect(e.clone().ret).toEqual("1");
        });

        it('should clone obj ret', function() {
          var e = library.getInitialEnv()
          e.ret = {};
          expect(e.clone().ret !== e.ret).toEqual(true);
        });

        it('should clone obj ctx', function() {
          var e = library.getInitialEnv()
          e.ctx.generic = new library.Generic();
          e.ctx.generic.one = "1";
          expect(e.clone().ctx.generic.one).toEqual("1");
        });

        it('should clone built in write fn', function() {
          var clonedEnv = library.getInitialEnv().clone();
          expect(clonedEnv.ctx.write.fn instanceof Function).toEqual(true);
          expect(clonedEnv.ctx.write.description instanceof Function).toEqual(true);
        });

        it('should clone built in types', function() {
          var clonedEnv = library.getInitialEnv().clone();
          expect(clonedEnv.ctx._types.list instanceof Function).toEqual(true);
          expect(clonedEnv.ctx._types.generic instanceof Function).toEqual(true);
        });
      });
    });
  });
});
