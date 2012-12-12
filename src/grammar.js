;(function(exports) {
  exports.Grammar = {};

  var grammarArr = [
    "{",
    "  var nnode = function(tag, content) {",
    "    if(content !== undefined) {",
    "      return { tag: tag, c: content };",
    "    }",
    "    else {",
    "      return { tag: tag };",
    "    }",
    "  };",
    "}",

    "start",
    "  = all:block { return nnode('root', [all]); }",

    "block",
    "  = all:expression+ { return nnode('block', all); }",

    "expression",
    "  = all:type_assignment { return nnode('expression', [all]); }",
    "  / all:value_assignment { return nnode('expression', [all]); }",
    "  / all:list_assignment { return nnode('expression', [all]); }",
    "  / all:invocation { return nnode('expression', [all]); }",

    "type_assignment",
    "  = a:assignee _ ia:is_a _ id:identifier nl",
    "    { return nnode('type_assignment', [a, ia, id]); }",

    "value_assignment",
    "  = a:assignee _ i:is _ v:value nl",
    "    { return nnode('value_assignment', [a, i, v]); }",

    "list_assignment",
    "  = lo:list_operation _ va:value _ tf:to_from _ as:assignee nl",
    "    { return nnode('list_assignment', [lo, va, tf, as]); }",

    "invocation",
    "  = a:identifier _ v:value nl",
    "    { return nnode('invocation', [a, v]); }",

    "list_operation",
    "  = all:add { return nnode('list_operation', [all]); }",
    "  / all:take { return nnode('list_operation', [all]); }",

    "assignee",
    "  = all:object { return nnode('assignee', [all]); }",
    "  / all:scalar { return nnode('assignee', [all]); }",

    "value",
    "  = all:literal { return nnode('value', [all]); }",
    "  / all:variable { return nnode('value', [all]); }",

    "literal",
    "  = all:string { return nnode('literal', [all]); }",
    "  / all:integer { return nnode('literal', [all]); }",

    "identifier",
    "  = !keyword all:identifier_char+ { return nnode('identifier', [all.join('')]); }",

    "variable",
    "  = all:object { return nnode('variable', [all]); }",
    "  / all:scalar { return nnode('variable', [all]); }",

    "scalar",
    "  = all:identifier { return nnode('scalar', [all]); }",

    "object",
    "  = id1:identifier _ id2:identifier { return nnode('object', [id1, id2]); }",

    "is",
    "  = all:'is' { return nnode('is', [all]); }",

    "is_a",
    "  = all:'is a' { return nnode('is_a', [all]); }",

    "add",
    "  = all:'add' { return nnode('add', [all]); }",

    "take",
    "  = all:'take' { return nnode('take', [all]); }",

    "to_from",
    "  = all:to { return nnode('to_from', ['to from']); }",
    "  / all:from { return nnode('to_from', ['to from']); }",

    "integer",
    "  = first:[1-9] rest:[0-9]* { return nnode('integer', [parseInt(first + rest.join(''))]); }",

    "string",
    "  = \"'\" all:string_char_single* \"'\" { return nnode('string', [all.join('')]); }",
    "  / '\"' all:string_char_double* '\"' { return nnode('string', [all.join('')]); }",

    "nl",
    "  = all:[\\n]+ { return nnode('nl', all); }",

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
    "identifier_char = [a-z0-9]",
    "string_char_double = [A-Za-z0-9., ']",
    "string_char_single = [A-Za-z0-9., \"]"
  ];

  var peg = "";
  for (var i = 0; i < grammarArr.length; i++) {
    peg += grammarArr[i] + "\n";
  }

  exports.Grammar.peg = peg;
})(typeof exports === 'undefined' ? this.Isla : exports);
