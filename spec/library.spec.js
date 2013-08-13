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
          expect(library.clone(l).items()[0]).toEqual("1");
          expect(library.clone(l).items()[1]).toEqual("2");
          expect(library.clone(l) !== l).toEqual(true);
          expect(library.clone(l).constructor === library.List).toEqual(true);
        });

        it('should clone list inside list', function() {
          var l = new library.List();
          var innerL = new library.List();
          innerL.add("1");
          l.add(innerL);
          expect(library.clone(l).items()[0].items()[0]).toEqual("1");
          expect(library.clone(l).items()[0] !== innerL).toEqual(true);
          expect(library.clone(l).items()[0].constructor === library.List).toEqual(true);
        });

        it('should clone generic inside list', function() {
          var l = new library.List();
          var g = new library.Generic();
          g.la = "1";
          l.add(g);
          expect(library.clone(l).items()[0].la).toEqual("1");
          expect(library.clone(l) !== l).toEqual(true);
          expect(library.clone(l).items()[0].constructor === library.Generic).toEqual(true);
        });
      });

      describe('Generic', function(){
        it('should have two elements in clone that appear in original', function() {
          var g = new library.Generic();
          g.one = "1";
          g.two = "2";
          expect(library.clone(g).one).toEqual("1");
          expect(library.clone(g).two).toEqual("2");
          expect(library.clone(g) !== g).toEqual(true);
          expect(library.clone(g) instanceof library.Generic).toEqual(true);
        });

        it('should clone a list inside a generic', function() {
          var g = new library.Generic();
          var l = new library.List();
          l.add("1");
          g.l = l;
          expect(library.clone(g).l.items()[0]).toEqual("1");
          expect(library.clone(g).l !== l).toEqual(true);
          expect(library.clone(g).l.constructor === library.List).toEqual(true);
        });

        it('should clone generic inside generic', function() {
          var g = new library.Generic();
          var innerG = new library.Generic();
          innerG.one = "1";
          g.innerG = innerG;
          expect(library.clone(g).innerG.one).toEqual("1");
          expect(library.clone(g).innerG !== innerG).toEqual(true);
          expect(library.clone(g).innerG.constructor === library.Generic).toEqual(true);
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

        it('should not find vars added to clone in original', function() {
          var e = library.getInitialEnv();
          var c = e.clone();
          interpreter.interpret("a is '1'", c);
          expect(e.ctx.a).toBeUndefined();
          expect(c.ctx.a).toEqual("1");
        });
      });

      describe('references', function(){
        it('should reproduce in clone shared generic via ref', function() {
          var e = library.getInitialEnv()
          e.ctx.shared = new library.Generic();
          e.ctx.a = new library.Generic();
          e.ctx.b = new library.Generic();
          e.ctx.a.shared = e.ctx.b.shared = e.ctx.shared;
          expect(e.ctx.a.shared === e.ctx.b.shared).toEqual(true);
          expect(e.ctx.a === e.ctx.b).toEqual(false);

          var c = e.clone();
          expect(e.ctx.a.shared !== c.ctx.a.shared).toEqual(true);
          expect(c.ctx.a.shared === c.ctx.b.shared).toEqual(true);
        });

        it('should reproduce in clone shared list via ref', function() {
          var e = library.getInitialEnv()
          e.ctx.shared = new library.List();
          e.ctx.shared.add(1);
          e.ctx.shared.add(2);
          e.ctx.a = new library.Generic();
          e.ctx.b = new library.Generic();
          e.ctx.a.shared = e.ctx.b.shared = e.ctx.shared;
          expect(e.ctx.a.shared === e.ctx.b.shared).toEqual(true);

          var c = e.clone();
          expect(e.ctx.a.shared !== c.ctx.a.shared).toEqual(true);
          expect(c.ctx.a.shared === c.ctx.b.shared).toEqual(true);
        });

        it('should reproduce in clone shared obj via ref', function() {
          var e = library.getInitialEnv()
          e.ctx.shared = {};
          e.ctx.a = { shared: e.ctx.shared };
          e.ctx.b = { shared: e.ctx.shared };
          expect(e.ctx.a.shared === e.ctx.b.shared).toEqual(true);
          expect(e.ctx.a === e.ctx.b).toEqual(false);

          var c = e.clone();
          expect(e.ctx.a.shared !== c.ctx.a.shared).toEqual(true);
          expect(c.ctx.a.shared === c.ctx.b.shared).toEqual(true);
        });

        it('should reproduce in clone shared array via ref', function() {
          var e = library.getInitialEnv()
          e.ctx.shared = [1, 2];
          e.ctx.a = new library.Generic();
          e.ctx.b = new library.Generic();
          e.ctx.a.shared = e.ctx.b.shared = e.ctx.shared;
          expect(e.ctx.a.shared === e.ctx.b.shared).toEqual(true);

          var c = e.clone();
          expect(e.ctx.a.shared !== c.ctx.a.shared).toEqual(true);
          expect(c.ctx.a.shared === c.ctx.b.shared).toEqual(true);
        });

        it('should reproduce in clone shared obj inside shared obj via refs', function() {
          var e = library.getInitialEnv()
          e.ctx.shared1 = {};
          e.ctx.shared2 = { shared: e.ctx.shared1 }
          e.ctx.a = { shared: e.ctx.shared2 };
          e.ctx.b = { shared: e.ctx.shared2 };
          expect(e.ctx.a.shared === e.ctx.b.shared).toEqual(true);
          expect(e.ctx.a === e.ctx.b).toEqual(false);

          var c = e.clone();
          expect(e.ctx.a.shared !== c.ctx.a.shared).toEqual(true);
          expect(c.ctx.a.shared === c.ctx.b.shared).toEqual(true);

          expect(e.ctx.a.shared.shared !== c.ctx.a.shared.shared).toEqual(true);
          expect(c.ctx.a.shared.shared === c.ctx.b.shared.shared).toEqual(true);

          expect(c.ctx.a.shared === c.ctx.shared2).toEqual(true);
          expect(c.ctx.a.shared.shared === c.ctx.shared1).toEqual(true);
        });
      });
    });
  });
});
