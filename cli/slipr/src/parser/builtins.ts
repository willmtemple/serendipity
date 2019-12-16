// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { expression } from "@serendipity/syntax-surface";

import { SExpressionArray, SExpression } from "./sexpression";
import { intoExpression, intoStatement } from ".";

type ExpressionReducer = (e: SExpressionArray) => expression.Expression;

function requireExact(len: number, fn: ExpressionReducer): ExpressionReducer {
  return (e: SExpressionArray) => {
    if (e.length !== len) {
      throw new Error(
        `Wrong length for builtin '${e[0]}' SExpression. Got ${e.length} but ${len} required: ` + e
      );
    } else {
      return fn(e);
    }
  };
}

function requireAtLeast(len: number, fn: ExpressionReducer): ExpressionReducer {
  return (e: SExpressionArray) => {
    if (e.length < len) {
      throw new Error(
        `Wrong length for builtin '${e[0]}' SExpression. Got ${e.length} but at least ${len} required.`
      );
    } else {
      return fn(e);
    }
  };
}

export function requireAllSymbols(sexpr: SExpressionArray): string[] {
  if (!sexpr.every((e) => typeof e === "string")) {
    throw new Error("Expected only symbols in function definition for: " + sexpr);
  }

  return sexpr as string[];
}

/**
 * Defines language-level builtin values (as names)
 *
 * Currently, the only value is
 * - empty (type void)
 */
export const builtinValues: { [k: string]: expression.Expression } = {
  empty: {
    exprKind: "void"
  },
  true: {
    exprKind: "boolean",
    value: true
  },
  false: {
    exprKind: "boolean",
    value: false
  },
  "...": {
    exprKind: "@hole"
  }
};

/**
 * Defines language-level builtin value constructors such as
 *
 * - Arithmetic + - / *
 * - Comparison > < >= <= == !=
 * - tuple construction (cons ...)
 * - accessor (get-property <expr> <expr>)
 * - procs and lambdas
 * - if expressions
 * - list constructor (to be removed pending variadic macros)
 */
export const builtinConstructors: { [k: string]: (sexpr: SExpression) => expression.Expression } = {
  ">": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "compare",
    op: ">",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "<": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "compare",
    op: "<",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  ">=": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "compare",
    op: ">=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "<=": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "compare",
    op: "<=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "=": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "compare",
    op: "==",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "!=": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "compare",
    op: "!=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "+": requireAtLeast(3, (sexpr: SExpressionArray) => {
    const folder = (inExpr: SExpressionArray): expression.Expression =>
      inExpr.length > 1
        ? {
            exprKind: "arithmetic",
            op: "+",
            left: intoExpression(inExpr[0]),
            right: folder(inExpr.slice(1))
          }
        : intoExpression(inExpr[0]);
    return folder(sexpr.slice(1));
  }),
  "*": requireAtLeast(3, (sexpr: SExpressionArray) => {
    const folder = (inExpr: SExpressionArray): expression.Expression =>
      inExpr.length > 1
        ? {
            exprKind: "arithmetic",
            op: "*",
            left: intoExpression(inExpr[0]),
            right: folder(inExpr.slice(1))
          }
        : intoExpression(inExpr[0]);
    return folder(sexpr.slice(1));
  }),
  "-": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "arithmetic",
    op: "-",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "/": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "arithmetic",
    op: "/",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  cons: requireAtLeast(2, (sexpr: SExpressionArray) => ({
    exprKind: "tuple",
    values: sexpr.slice(1).map(intoExpression)
  })),
  "get-property": requireExact(3, (sexpr: SExpressionArray) => ({
    exprKind: "accessor",
    accessee: intoExpression(sexpr[1]),
    index: intoExpression(sexpr[2])
  })),
  proc: requireAtLeast(1, (sexpr: SExpressionArray) => ({
    exprKind: "procedure",
    body: sexpr.slice(1).map(intoStatement)
  })),
  fn: requireExact(3, (sexpr: SExpressionArray) => {
    // Will need to tweak this check when I support types
    if (!(sexpr[1] instanceof Array)) {
      throw new Error(
        `Anonymous function constructor expected parameters to be a list, but it was '${sexpr[1]}' in SExpression: ` +
          sexpr
      );
    }
    const parameters = requireAllSymbols(sexpr[1]);

    return {
      exprKind: "closure",
      parameters,
      body: intoExpression(sexpr[2])
    };
  }),
  if: requireExact(4, (sexpr: SExpressionArray) => ({
    exprKind: "if",
    cond: intoExpression(sexpr[1]),
    then: intoExpression(sexpr[2]),
    _else: intoExpression(sexpr[3])
  })),
  list: (sexpr: SExpressionArray) => {
    const contents = sexpr.slice(1);

    const folder = (rest: SExpressionArray): expression.Expression =>
      rest.length > 0
        ? {
            exprKind: "tuple",
            values: [intoExpression(rest[0]), folder(rest.slice(1))]
          }
        : {
            exprKind: "void"
          };

    return folder(contents);
  },
  with: requireExact(3, (sexpr: SExpressionArray) => {
    if (!(sexpr[1] instanceof Array) || sexpr[1].length !== 2 || typeof sexpr[1][0] !== "string") {
      throw new Error(
        `\`with\` expression expected binding shape [symbol SExpression], but it was '${sexpr[1]}' in SExpression: ` +
          sexpr
      );
    }
    return {
      exprKind: "with",
      binding: [sexpr[1][0], intoExpression(sexpr[1][1])],
      expr: intoExpression(sexpr[2])
    };
  })
};

export const allBuiltins = [
  ...Object.keys(builtinConstructors).filter((k) =>
    Object.prototype.hasOwnProperty.call(builtinConstructors, k)
  ),
  ...Object.keys(builtinValues).filter((k) =>
    Object.prototype.hasOwnProperty.call(builtinValues, k)
  ),
  "define",
  "main",
  "print",
  "do",
  "let",
  "if",
  "for-in",
  "loop",
  "break"
];
