var interpreter = require('../src/interpreter').Interpreter;

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
  });
});
