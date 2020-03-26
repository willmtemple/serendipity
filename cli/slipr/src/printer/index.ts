// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Expression, Statement, Global } from "@serendipity/syntax-surface";

import { match } from "omnimatch";

export function writeExpression(e: Expression, level: number): string {
  let accum = "";

  let indent = "";
  for (let i = 0; i < level; i++) {
    indent += "  ";
  }

  const wx = (ex: Expression): string => writeExpression(ex, level);
  match(e, {
    Accessor: ({ accessee, index }) => {
      accum += wx(accessee) + "." + wx(index);
    },
    Arithmetic: ({ op, left, right }) => {
      accum += "(" + [op, wx(left), wx(right)].join(" ") + ")";
    },
    Number: ({ value }) => {
      accum += value;
    },
    String: ({ value }) => {
      accum += '"' + value + '"';
    },
    Name: ({ name }) => {
      accum += name;
    },
    Boolean: ({ value }) => {
      accum += value;
    },
    With: ({ binding: [name, value], expr }) => {
      accum +=
        `(with [${name}: ${writeExpression(value, 0)}` +
        "]\n" +
        indent +
        "  " +
        writeExpression(expr, level + 1) +
        "\n" +
        indent +
        ")";
    },
    Call: ({ callee, parameters }) => {
      accum += "(" + wx(callee) + parameters.map(writeExpression).join(" ") + ")";
    },
    Closure: ({ parameters, body }) => {
      accum += "(fn (" + parameters.join(" ") + ") \n" + writeExpression(body, level + 1) + ")";
    },
    List: ({ contents }) => {
      accum += "`[" + contents.map(writeExpression).join(" ") + "]";
    },
    Tuple: ({ values }) => {
      accum += "(cons " + values.map(writeExpression).join(" ") + ")";
    },
    Procedure: ({ body }) => {
      accum +=
        "(proc\n" +
        body.map((s) => indent + "[" + writeStatement(s, level + 1, false) + "]").join("\n") +
        "\n)";
    },
    Void: () => {
      accum += "empty";
    },
    If: ({ cond, then, _else }) => {
      accum +=
        "(if " +
        wx(cond) +
        "\n" +
        writeExpression(then, level + 1) +
        "\n" +
        writeExpression(_else, level + 1) +
        ")";
    },
    Compare: ({ left, right, op }) => {
      accum += "(" + [op, wx(left), wx(right)].join(" ") + ")";
    },
    "@hole": () => {
      accum += "...";
    }
  });
  return accum;
}

export function writeStatement(s: Statement, level: number, skipIndent: boolean): string {
  let accum = "";
  let indent = "";
  if (!skipIndent) {
    for (let i = 0; i < level; i++) {
      indent += "    ";
    }
  }
  accum += indent;

  match(s, {
    Print: ({ value }) => {
      accum += "print " + writeExpression(value, level);
    },
    Let: ({ name, value }) => {
      accum += "let " + name + " = " + writeExpression(value, level);
    },
    Set: ({ name, value }) => {
      accum += name + " = " + writeExpression(value, level);
    },
    If: ({ condition, body, _else }) => {
      accum +=
        "if " + writeExpression(condition, level) + " [" + writeStatement(body, level + 1, false);
      if (_else) {
        accum += "\n" + indent + "else \n" + writeStatement(_else, level + 1, false);
      }
    },
    ForIn: ({ value, binding, body }) => {
      accum +=
        "for " +
        binding +
        " in " +
        writeExpression(value, level) +
        " " +
        writeStatement(body, level, true);
    },
    Forever: ({ body }) => {
      accum += "forever " + writeStatement(body, level, true);
    },
    Do: ({ body }) => {
      accum += "do " + writeExpression(body, level);
    },
    Break: (_) => {
      accum += "break";
    },
    "@hole": (_) => {
      accum += "<@>";
    }
  });
  return accum;
}

export function writeGlobal(g: Global): string {
  let accum = "";
  match(g, {
    Main: ({ body }) => {
      accum += "main " + writeExpression(body, 0);
    },
    Define: ({ name, value }) => {
      accum += "define " + name + " = " + writeExpression(value, 0);
    },
    DefineFunction: ({ name, parameters, body }) => {
      accum += "define " + name + "(" + parameters.join(", ") + ") = " + writeExpression(body, 0);
    }
  });
  return accum;
}
