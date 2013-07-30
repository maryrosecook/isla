;(function(exports) {
  exports.Grammar = {};

  var grammarArr = [
    "{",
    "  var nnode = function(tag, content, column, syntax, code) {",
    "    var node = { tag: tag, c: content, index: column - 1};",
    "    if(syntax !== undefined) {",
    "      node.syntax = syntax;",
    "    }",

    "    if (code !== undefined) {",
    "      node.code = code;",
    "    }",

    "    return node;",
    "  };",

    "  var syn = function(obj, syntax) {",
    "    obj.syntax = syntax;",
    "    return obj;",
    "  };",
    "}",

    "start",
    "  = all:block { return nnode('root', [all], column); }",

    "block",
    "  = _* all:expression+ { return nnode('block', all, column); }",

    "expression",
    "  = all:type_assignment { return nnode('expression', [all], column); }",
    "  / all:value_assignment { return nnode('expression', [all], column); }",
    "  / all:list_assignment { return nnode('expression', [all], column); }",
    "  / all:invocation { return nnode('expression', [all], column); }",

    "type_assignment",
    "  = a:assignee _ ia:is_a _ id:identifier _* nl",
    "    { return nnode('type_assignment', [a, ia, syn(id, 'type')], column); }",

    "value_assignment",
    "  = a:assignee _ i:is _ v:value _* nl",
    "    { return nnode('value_assignment', [a, i, v], column); }",

    "list_assignment",
    "  = lo:list_operation _ va:value _ tf:to_from _ as:assignee _* nl",
    "    { return nnode('list_assignment', [lo, va, tf, as], column); }",

    "invocation",
    "  = a:identifier _ v:value _* nl",
    "    { return nnode('invocation', [syn(a, 'function'), v], column); }",

    "list_operation",
    "  = all:add { return nnode('list_operation', [all], column); }",
    "  / all:take { return nnode('list_operation', [all], column); }",

    "assignee",
    "  = all:variable { return nnode('assignee', [all], column); }",

    "value",
    "  = all:literal { return nnode('value', [all], column); }",
    "  / all:variable { return nnode('value', [all], column); }",

    "literal",
    "  = all:string { return nnode('literal', [all], column, 'literal'); }",

    "identifier",
    "  = !keyword init:init_identifier_char rest:identifier_char* { return nnode('identifier', [init + rest.join('')], column); }",

    "variable",
    "  = id:identifier rest:variable_rest* { return nnode('variable', [syn(id, 'variable')].concat(rest), column); }",

    "variable_rest",
    "  = _ id:identifier { return syn(id, 'attribute'); }",

    "is",
    "  = all:'is' { return nnode('is', [all], column, 'keyword'); }",

    "is_a",
    "  = all:'is a' { return nnode('is_a', [all], column, 'keyword'); }",

    "add",
    "  = all:'add' { return nnode('add', [all], column, 'keyword'); }",

    "take",
    "  = all:'take' { return nnode('take', [all], column, 'keyword'); }",

    "to_from",
    "  = all:to { return nnode('to_from', ['to from'], column, 'keyword', 'to'); }",
    "  / all:from { return nnode('to_from', ['to from'], column, 'keyword', 'from'); }",

    "string",
    "  = \"'\" all:string_char_single* \"'\" { return nnode('string', [all.join('')], column, undefined, \"'\" + all.join('') + \"'\"); }",
    "  / '\"' all:string_char_double* '\"' { return nnode('string', [all.join('')], column, undefined, '\"' + all.join('') + '\"'); }",

    "nl",
    "  = all:[\\n]+ { return nnode('nl', all, column); }",

    "keyword",
    "  = is !identifier_char",
    "  / is_a !identifier_char",
    "  / add !identifier_char",
    "  / take !identifier_char",
    "  / to !identifier_char",
    "  / from !identifier_char",

    "to = 'to'",
    "from = 'from'",
    "_ = [ \\t\\r]+",
    "identifier_char = [a-zA-Z0-9_]",
    "init_identifier_char = [a-zA-Z_]",
    "string_char_double = [A-Za-z0-9., ']",
    "string_char_single = [A-Za-z0-9., \"]"
  ];

  var peg = "";
  for (var i = 0; i < grammarArr.length; i++) {
    peg += grammarArr[i] + "\n";
  }

  exports.Grammar.peg = peg;
})(typeof exports === 'undefined' ? this.Isla : exports);
