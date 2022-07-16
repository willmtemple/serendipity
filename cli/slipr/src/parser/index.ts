// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as fs from "fs";

import { Module, Global, Expression, Statement } from "@serendipity/syntax-surface";

import {
  atomize,
  tokenize,
  intoSExpression,
  SExpression,
  SExpressionArray,
  chars,
} from "./sexpression";

type ExpressionReducer = (e: SExpressionArray) => Expression;

const requireExact = (len: number, fn: ExpressionReducer): ExpressionReducer =>
  requireBetween([len, len], fn);

const requireAtLeast = (len: number, fn: ExpressionReducer): ExpressionReducer =>
  requireBetween([len, undefined], fn);

/* const _requireAtMost = (len: number, fn: ExpressionReducer): ExpressionReducer =>
  requireBetween([undefined, len], fn);*/

function requireBetween(
  lens: [l?: number | undefined, r?: number | undefined],
  fn: ExpressionReducer
): ExpressionReducer {
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

function assertAllSymbols(sexpr: SExpressionArray): string[] {
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
const builtinValues: { [k: string]: Expression } = {
  empty: {
    kind: "Void",
  },
  true: {
    kind: "Boolean",
    value: true,
  },
  false: {
    kind: "Boolean",
    value: false,
  },
  "...": {
    kind: "@hole",
  },
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
const builtinConstructors: { [k: string]: ExpressionReducer } = {
  ">": requireExact(
    3,
    (sexpr: SExpressionArray): Expression => ({
      kind: "Compare",
      op: ">",
      left: intoExpression(sexpr[1]),
      right: intoExpression(sexpr[2]),
    })
  ),
  "<": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "<",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  ">=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: ">=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  "<=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "<=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  "=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "==",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  "!=": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Compare",
    op: "!=",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  "+": requireAtLeast(3, (sexpr: SExpressionArray) => {
    const folder = (inExpr: SExpressionArray): Expression =>
      inExpr.length > 1
        ? {
            kind: "Arithmetic",
            op: "+",
            left: intoExpression(inExpr[0]),
            right: folder(inExpr.slice(1)),
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
            right: folder(inExpr.slice(1)),
          }
        : intoExpression(inExpr[0]);
    return folder(sexpr.slice(1));
  }),
  "-": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Arithmetic",
    op: "-",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  "/": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Arithmetic",
    op: "/",
    left: intoExpression(sexpr[1]),
    right: intoExpression(sexpr[2]),
  })),
  cons: requireAtLeast(2, (sexpr: SExpressionArray) => ({
    kind: "Tuple",
    values: sexpr.slice(1).map(intoExpression),
  })),
  "get-property": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Accessor",
    accessee: intoExpression(sexpr[1]),
    index: intoExpression(sexpr[2]),
  })),
  // TODO: this should be a lib function rather than a syntax-level intrinsic
  readline: requireBetween([1, 2], (sexpr: SExpressionArray) => ({
    kind: "Call",
    callee: {
      kind: "Name",
      name: "__core.read_line",
    },
    parameters: [intoExpression(sexpr[1])],
  })),
  "str-split": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Call",
    callee: {
      kind: "Name",
      name: "__core.str_split",
    },
    parameters: [intoExpression(sexpr[1]), intoExpression(sexpr[2])],
  })),
  "str-cat": requireExact(3, (sexpr: SExpressionArray) => ({
    kind: "Call",
    callee: {
      kind: "Name",
      name: "__core.str_cat",
    },
    parameters: [intoExpression(sexpr[1]), intoExpression(sexpr[2])],
  })),
  proc: requireAtLeast(1, (sexpr: SExpressionArray) => ({
    kind: "Procedure",
    body: sexpr.slice(1).map(intoStatement),
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
      body: intoExpression(sexpr[2]),
    };
  }),
  if: requireExact(4, (sexpr: SExpressionArray) => ({
    kind: "If",
    cond: intoExpression(sexpr[1]),
    then: intoExpression(sexpr[2]),
    _else: intoExpression(sexpr[3]),
  })),
  list: (sexpr: SExpressionArray) => ({
    kind: "List",
    contents: sexpr.slice(1).map(intoExpression),
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
      expr: intoExpression(sexpr[2]),
    };
  }),
};

const allBuiltins = [
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
  "break",
];

export interface Parser {
  parse(input: fs.ReadStream): Promise<Module>;
}

export function intoExpression(sexpr: SExpression): Expression {
  if (typeof sexpr === "number") {
    // Expr is a number, so it just becomes a number
    return {
      kind: "Number",
      value: sexpr,
    };
  } else if (typeof sexpr === "string") {
    // The expr being parsed is a string atom, so if it's a string literal, use that,
    // otherwise, it could be a value-builtin, so resolve that. Else treat it like a
    // name

    if (sexpr.startsWith('"')) {
      return {
        kind: "String",
        value: sexpr.slice(1, sexpr.length - 1),
      };
    }

    const maybeValue = builtinValues[sexpr];
    return maybeValue
      ? maybeValue
      : {
          kind: "Name",
          name: sexpr,
        };
  } else {
    // Expr is a list, so it is some kind of call/constructor. Check builtins
    // for builtin value constructors, otherwise treat it like a
    // function call. In the future we will also check for stx macros here

    if (typeof sexpr[0] === "string" && builtinConstructors[sexpr[0]]) {
      return builtinConstructors[sexpr[0]](sexpr);
    } else if (sexpr.length < 1) {
      // TODO: find some way to remove this hardcoded association from [] to empty
      return builtinValues["empty"];
    }

    // Type checks down the line will catch issues such as calling a number and etc.
    // No need to worry about this now.
    return {
      kind: "Call",
      callee: intoExpression(sexpr[0]),
      parameters: sexpr.slice(1).map(intoExpression),
    };
  }
}

function requireLength(n: number, sexpr: SExpressionArray): void {
  if (sexpr.length !== n) {
    throw new Error(
      `Wrong length for '${sexpr[0]}' SExpression. Got ${sexpr.length} but ${n} required: ` + sexpr
    );
  }
}

export function intoStatement(sexpr: SExpression): Statement {
  if (!(sexpr instanceof Array) || sexpr.length < 1) {
    throw new Error(
      "Attempted to parse a singular atom as a statement. Expected a non-empty list but got " +
        sexpr
    );
  }

  const assertLength = (n: number): void => requireLength(n, sexpr);

  switch (sexpr[0]) {
    case "print":
      assertLength(2);
      return {
        kind: "Print",
        value: intoExpression(sexpr[1]),
      };
    case "let":
      assertLength(3);
      if (typeof sexpr[1] !== "string") {
        throw new Error("Expected a symbol in let binding, but got " + sexpr);
      } else if (allBuiltins.includes(sexpr[1])) {
        throw new Error(`Attempted to redefine builtin '${sexpr[1]} : '` + sexpr);
      }
      return {
        kind: "Let",
        name: sexpr[1],
        value: intoExpression(sexpr[2]),
      };
    case "set!":
      assertLength(3);
      if (typeof sexpr[1] !== "string") {
        throw new Error("Expected a symbol in set! statement, but got " + sexpr);
      } else if (allBuiltins.includes(sexpr[1])) {
        throw new Error(`Attempted to set builtin '${sexpr[1]} : '` + sexpr);
      }
      return {
        kind: "Set",
        name: sexpr[1],
        value: intoExpression(sexpr[2]),
      };
    case "if":
      if (sexpr.length !== 3 && sexpr.length !== 4) {
        throw new Error(
          `Wrong length for 'if' SExpression. Expected 3-4 items but got ${sexpr.length} :` + sexpr
        );
      }
      return sexpr.length === 3
        ? {
            kind: "If",
            condition: intoExpression(sexpr[1]),
            body: intoStatement(sexpr[2]),
          }
        : {
            kind: "If",
            condition: intoExpression(sexpr[1]),
            body: intoStatement(sexpr[2]),
            _else: intoStatement(sexpr[3]),
          };
    case "for-in":
      assertLength(3);
      if (
        !(sexpr[1] instanceof Array) ||
        sexpr[1].length !== 2 ||
        typeof sexpr[1][0] !== "string"
      ) {
        throw new Error(
          `Expected a list with shape [symbol SExpression] in for-in statement but found ${sexpr[1]} :` +
            sexpr
        );
      } else if (allBuiltins.includes(sexpr[1][0])) {
        throw new Error(`Attempted to redefine builtin '${sexpr[1][0]} : '` + sexpr);
      }
      return {
        kind: "ForIn",
        binding: sexpr[1][0],
        value: intoExpression(sexpr[1][1]),
        body: intoStatement(sexpr[2]),
      };
    case "loop":
      assertLength(2);
      return {
        kind: "Forever",
        body: intoStatement(sexpr[1]),
      };
    case "do":
      assertLength(2);
      return {
        kind: "Do",
        body: intoExpression(sexpr[1]),
      };
    case "break":
      assertLength(1);
      return {
        kind: "Break",
      };
    default:
      throw new Error(
        `Unrecognized statement: ${sexpr[0]}. Expected one of: print, let, if, for-in, loop, do, break`
      );
  }
}

function intoGlobal(sexpr: SExpression): Global {
  if (!(sexpr instanceof Array) || sexpr.length < 1) {
    throw new Error(
      "Attempted to parse a singular atom as a global. Expected a non-empty list but got " + sexpr
    );
  }

  switch (sexpr[0]) {
    case "main":
      if (sexpr.length !== 2) {
        throw new Error(
          `Wrong length for 'main' SExpression. Got ${sexpr.length} but 2 required: ` + sexpr
        );
      }
      return {
        kind: "Main",
        body: intoExpression(sexpr[1]),
      };
    case "define":
      if (sexpr.length !== 3) {
        throw new Error(
          `Wrong length for 'define' SExpression. Got ${sexpr.length} but 3 required: ` + sexpr
        );
      }

      if (sexpr[1] instanceof Array) {
        // Defining a function (need to make sure the _name_ is not a reserved word)

        const fnDef = assertAllSymbols(sexpr[1]);

        if (fnDef.length < 1) {
          throw new Error(`Function definition has no name in SExpression: ` + sexpr);
        } else if (allBuiltins.includes(fnDef[0])) {
          throw new Error(
            `Attempted to redefine builtin '${fnDef[0]}' in function definition: ` + sexpr
          );
        }

        return {
          kind: "DefineFunction",
          name: fnDef[0],
          parameters: fnDef.slice(1),
          body: intoExpression(sexpr[2]),
        };
      } else if (typeof sexpr[1] === "string") {
        // Defining a name (need to make sure it's not a reserved word)

        if (allBuiltins.includes(sexpr[1])) {
          throw new Error(`Attempted to redefine builtin '${sexpr[1]}': ` + sexpr);
        }

        return {
          kind: "Define",
          name: sexpr[1],
          value: intoExpression(sexpr[2]),
        };
      } else {
        throw new Error("Attempted to define a number.");
      }
    default:
      throw new Error(`Unrecognized global: ${sexpr[0]}. Expected one of: main, define`);
  }
}

async function collect<T>(input: AsyncIterable<T>): Promise<T[]> {
  const r = [];
  for await (const v of input) {
    r.push(v);
  }

  return r;
}

async function parse(input: fs.ReadStream): Promise<Module> {
  const tokens = await collect(tokenize(chars(input)));
  const atoms = atomize(tokens);
  const sExpr = intoSExpression(atoms);

  return {
    globals: sExpr.map(intoGlobal),
  };
}

const defaultParser: Parser = { parse };

export default defaultParser;
