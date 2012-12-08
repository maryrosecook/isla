# Isla

* by mary rose cook
* http://maryrosecook.com
* maryrosecook@maryrosecook.com

An interpreter for Isla in JavaScript.

## Get the code

Install Node.js and npm: https://github.com/isaacs/npm

Install Isla

    $ npm install isla
    $ cd path/to/isla
    $ npm install

## Use the code

### node

    var Isla = require('../src/isla').Isla;
    Isla.Interpreter.interpret("write 'Hello, world.'");

### Browser

    <script type="text/javascript" src="/node_modules/underscore/underscore-min.js"></script>
    <script type="text/javascript" src="/node_modules/multimethod/multimethod-min.js"></script>
    <script type="text/javascript" src="/node_modules/pegjs/lib/peg.js"></script>
    <script type="text/javascript" src="/src/isla.js"></script>
    <script type="text/javascript" src="/src/utils.js"></script>
    <script type="text/javascript" src="/src/grammar.js"></script>
    <script type="text/javascript" src="/src/library.js"></script>
    <script type="text/javascript" src="/src/parser.js"></script>
    <script type="text/javascript" src="/src/interpreter.js"></script>

    <script type="text/javascript">
      Isla.Interpreter.interpret("write 'Hello, world.'");
    </script>

## Run the tests

    $ npm test
