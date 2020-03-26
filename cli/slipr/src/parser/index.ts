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
  chars
} from "./sexpression";
import { builtinConstructors, builtinValues, allBuiltins, assertAllSymbols } from "./builtins";

export interface Parser {
  parse(input: fs.ReadStream): Promise<Module>;
}

export function intoExpression(sexpr: SExpression): Expression {
  if (typeof sexpr === "number") {
    // Expr is a number, so it just becomes a number
    return {
      kind: "Number",
      value: sexpr
    };
  } else if (typeof sexpr === "string") {
    // The expr being parsed is a string atom, so if it's a string literal, use that,
    // otherwise, it could be a value-builtin, so resolve that. Else treat it like a
    // name

    if (sexpr.startsWith('"')) {
      return {
        kind: "String",
        value: sexpr.slice(1, sexpr.length - 1)
      };
    }

    const maybeValue = builtinValues[sexpr];
    return maybeValue
      ? maybeValue
      : {
          kind: "Name",
          name: sexpr
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
      parameters: sexpr.slice(1).map(intoExpression)
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
        value: intoExpression(sexpr[1])
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
        value: intoExpression(sexpr[2])
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
        value: intoExpression(sexpr[2])
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
            body: intoStatement(sexpr[2])
          }
        : {
            kind: "If",
            condition: intoExpression(sexpr[1]),
            body: intoStatement(sexpr[2]),
            _else: intoStatement(sexpr[3])
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
        body: intoStatement(sexpr[2])
      };
    case "loop":
      assertLength(2);
      return {
        kind: "Forever",
        body: intoStatement(sexpr[1])
      };
    case "do":
      assertLength(2);
      return {
        kind: "Do",
        body: intoExpression(sexpr[1])
      };
    case "break":
      assertLength(1);
      return {
        kind: "Break"
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
        body: intoExpression(sexpr[1])
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
          body: intoExpression(sexpr[2])
        };
      } else if (typeof sexpr[1] === "string") {
        // Defining a name (need to make sure it's not a reserved word)

        if (allBuiltins.includes(sexpr[1])) {
          throw new Error(`Attempted to redefine builtin '${sexpr[1]}': ` + sexpr);
        }

        return {
          kind: "Define",
          name: sexpr[1],
          value: intoExpression(sexpr[2])
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
    globals: sExpr.map(intoGlobal)
  };
}

const defaultParser: Parser = { parse };

export default defaultParser;
