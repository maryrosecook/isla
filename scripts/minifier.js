// Produces the minified version.

var packer = require( 'node.packer' ),
    path   = __dirname + '/../src/';

packer({
  log : true,
  input : [
    path + 'isla.js',
    path + 'utils.js',
    path + 'grammar.js',
    path + 'library.js',
    path + 'parser.js',
    path + 'interpreter.js'
  ],
  minify: true,
  output : path + 'isla.min.js',
  callback: function ( err, code ){
    err && console.log( err );
  }
});
