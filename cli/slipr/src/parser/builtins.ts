// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Expression } from "@serendipity/syntax-surface";

import { SExpressionArray } from "./sexpression";
import { intoExpression, intoStatement } from ".";

type ExpressionReducer = (e: SExpressionArray) => Expression;

const requireExact = (len: number, fn: ExpressionReducer): ExpressionReducer =>
  requireBetween([len, len], fn);

const requireAtLeast = (len: number, fn: ExpressionReducer): ExpressionReducer =>
  requireBetween([len, undefined], fn);

/* const _requireAtMost = (len: number, fn: ExpressionReducer): ExpressionReducer =>
  requireBetween([undefined, len], fn);*/

function requireBetween(lens: [number?, number?], fn: ExpressionReducer): ExpressionReducer {
  return (e: SExpressionArray) => {
    if ((lens[0] && e.length < lens[0]) || (lens[1] !== undefined && e.length > lens[1])) {
      let message = `Wrong length for builtin '${e[0]}' SExpression. Got ${e.length} items but required `;

      if (lens[0] === lens[1]) {
        message += "exactly " + lens[0] + ".";
      } else if (lens[0] && lens[1]) {
        message += `between ${lens[0]} and ${lens[1]}.`;
      } else if (lens[0] && !lens[1]) {
        message += `at least ${lens[0]}`;
      } else {
        message += `at most ${lens[1]}`;
      }

      throw new Error(message);
    } else {
      return fn(e);
    }
  };
}

export function assertAllSymbols(sexpr: SExpressionArray): string[] {
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
export const builtinValues: { [k: string]: Expression } = {
  empty: {
    kind: "Void"
  },
  true: {
    kind: "Boolean",
    value: true
  },
  false: {
    kind: "Boolean",
    value: false
  },
  "...": {
    kind: "@hole"
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
export const builtinConstructors: { [k: string]: ExpressionReducer } = {
  ">": requireExact(
    3,
    (sexpr: SExpressionArray): Expression => ({
      kind: "Compare",
      op: ">",
      left: intoExpression(sexpr[1]),
      right: intoExpression(sexpr[2])
    })
  ),
  "<": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "<",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  ">=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: ">=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "<=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "<=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "==",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "!=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "!=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "+": requireAtLeast(3, (sexpr: SExpressionArray) => {
    const folder = (inExpr: SExpressionArray): Expression =>
      inExpr.length > 1
        ? {
            kind: "Arithmetic",
            op: "+",
            left: intoExpression(inExpr[0]),
            right: folder(inExpr.slice(1))
          }
        : intoExpression(inExpr[0]);
    return folder(sexpr.slice(1));
  }),
  "*": requireAtLeast(3, (sexpr: SExpressionArray) => {
    const folder = (inExpr: SExpressionArray): Expression =>
      inExpr.length > 1
        ? {
            kind: "Arithmetic",
            op: "*",
            left: intoExpression(inExpr[0]),
            right: folder(inExpr.slice(1))
          }
        : intoExpression(inExpr[0]);
    return folder(sexpr.slice(1));
  }),
  "-": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Arithmetic",
    op: "-",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  "/": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Arithmetic",
    op: "/",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2])
  })),
  cons: requireAtLeast(2, (sexpr: SExpressionArray) => ({
    kind: "Tuple",
    values: sexpr.slice(1).map(intoExpression)
  })),
  "get-property": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Accessor",
    accessee: intoExpression(sexpr[1]),
    index: intoExpression(sexpr[2])
  })),
  // TODO: this should be a lib function rather than a syntax-level intrinsic
  readline: requireBetween([1, 2], (sexpr: SExpressionArray) => ({
    kind: "Call",
    callee: {
      kind: "Name",
      name: "__core.read_line"
    },
    parameters: [intoExpression(sexpr[1])]
  })),
  "str-split": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Call",
    callee: {
      kind: "Name",
      name: "__core.str_split"
    },
    parameters: [intoExpression(sexpr[1]), intoExpression(sexpr[2])]
  })),
  "str-cat": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Call",
    callee: {
      kind: "Name",
      name: "__core.str_cat"
    },
    parameters: [intoExpression(sexpr[1]), intoExpression(sexpr[2])]
  })),
  proc: requireAtLeast(1, (sexpr: SExpressionArray) => ({
    kind: "Procedure",
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
    const parameters = assertAllSymbols(sexpr[1]);

    return {
      kind: "Closure",
      parameters,
      body: intoExpression(sexpr[2])
    };
  }),
  if: requireExact(4, (sexpr: SExpressionArray) => ({
    kind: "If",
    cond: intoExpression(sexpr[1]),
    then: intoExpression(sexpr[2]),
    _else: intoExpression(sexpr[3])
  })),
  list: (sexpr: SExpressionArray) => ({
    kind: "List",
    contents: sexpr.slice(1).map(intoExpression)
  }),
  with: requireExact(3, (sexpr: SExpressionArray) => {
    if (!(sexpr[1] instanceof Array) || sexpr[1].length !== 2 || typeof sexpr[1][0] !== "string") {
      throw new Error(
        `\`with\` expression expected binding shape [symbol SExpression], but it was '${sexpr[1]}' in SExpression: ` +
          sexpr
      );
    }
    return {
      kind: "With",
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
