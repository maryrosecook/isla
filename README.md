# Isla

http://islalanguage.org

http://github.com/maryrosecook/isla

* by Mary Rose Cook
* http://maryrosecook.com
* maryrosecook@maryrosecook.com

A programming language for children.  The interpreter is written in JavaScript.  It runs in node or the browser.

## Language example

    isla is a person
    isla lunch is 'Jelly Tots'

    drum is a toy

    isla toys is a list
    add drum to isla toys

For more details on the language, see the language guide: https://github.com/maryrosecook/isla/wiki/Isla-language-guide

## Install

Install Node.js and npm: https://github.com/isaacs/npm

Install Isla

    $ npm install isla
    $ cd path/to/isla
    $ npm install

## Run

### Node.js

    var Isla = require('../src/isla').Isla;
    Isla.Interpreter.interpret("write 'Hello, world.'");

### Browser

    <script type="text/javascript" src="/node_modules/underscore/underscore-min.js"></script>
    <script type="text/javascript" src="/node_modules/multimethod/multimethod-min.js"></script>
    <script type="text/javascript" src="/node_modules/pegjs/lib/peg.js"></script>
    <script type="text/javascript" src="/src/isla.min.js"></script>

    <script type="text/javascript">
      Isla.Interpreter.interpret("write 'Hello, world.'");
    </script>

## Run the tests

    $ npm install --dev
    $ npm test

## Clojure

The Clojure Isla compiler is now at github.com/maryrosecook/islaclj
