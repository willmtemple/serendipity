// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { match } from "omnimatch";

import * as abstract from "@serendipity/syntax-abstract";
import * as surface from "@serendipity/syntax-surface";

import { Compiler, CompilerOutput } from "@serendipity/syntax";
import { ok, error } from "@serendipity/syntax/dist-esm/util/Result";

import { Y } from "./util";
import { foldProcedureCPS } from "./foldProcedure";
import { Closure, LiteralExpression } from "@serendipity/syntax-abstract";

/**
 * Create a curried function for a given set of parameters and a function body
 *
 * @param parameters the parameters to curry (may be empty)
 * @param body the body that results from the calling of the closure with all parameters
 */
export function curry(parameters: string[], body: surface.Expression): abstract.Closure {
  let val: abstract.Closure | undefined = undefined;

  if (parameters.length === 0) {
    // No parameter for this closure
    val = {
      kind: "Closure",
      body: lowerExpr(body),
    };
  } else {
    // Curry the paramters into separate closures.
    for (const p of parameters) {
      val = {
        kind: "Closure",
        parameter: p,
        // Stack the closures
        body: val ?? lowerExpr(body),
      };
    }
  }

  return val as abstract.Closure;
}

export function lowerExpr(e: surface.Expression): abstract.Expression {
  return match(e, {
    Number: (n) => n,
    String: (s) => s,
    Boolean: (b) => b,
    Name: (n) => n,
    Accessor: ({ accessee, index }) =>
      ({
        kind: "Accessor",
        accessee: lowerExpr(accessee),
        index: lowerExpr(index),
      } as const),
    Arithmetic: ({ op, left, right }) =>
      ({
        kind: "BinaryOp",
        op: op as abstract.BinaryOperator,
        left: lowerExpr(left),
        right: lowerExpr(right),
      } as const),
    With: ({ binding, expr }) => {
      // Use a Y combinator to get letrec semantics

      const almost: abstract.Expression = {
        kind: "Closure",
        parameter: binding[0],
        body: lowerExpr(binding[1]),
      };

      return {
        kind: "Call",
        callee: {
          kind: "Closure",
          parameter: binding[0],
          body: lowerExpr(expr),
        },
        parameter: Y(almost),
      } as const;
    },
    Call: ({ callee, parameters }) => {
      const calleeLowered = lowerExpr(callee);
      if (parameters.length === 0) {
        return {
          kind: "Call",
          callee: calleeLowered,
        } as const;
      } else {
        let call: abstract.Expression | undefined = undefined;
        for (const parameter of parameters.reverse()) {
          call = {
            kind: "Call",
            callee: call ?? calleeLowered,
            parameter: lowerExpr(parameter),
          };
        }
        return call as abstract.Expression;
      }
    },
    Closure: ({ parameters, body }) => curry(parameters, body),
    List: ({ contents }) => {
      let list: abstract.Expression = {
        kind: "Void",
      };

      for (const item of contents.reverse()) {
        list = {
          kind: "Tuple",
          values: [lowerExpr(item), list],
        };
      }

      return list;
    },
    Tuple: ({ values }) => ({ kind: "Tuple", values: values.map(lowerExpr) } as const),
    Record: ({ data }) =>
      ({
        kind: "Closure",
        parameter: "__key",
        body: {
          kind: "Case",
          _in: { kind: "Name", name: "__key" },
          cases: new Map(
            Object.entries(data).map(([k, v]) => [
              { kind: "String", value: k } as LiteralExpression,
              lowerExpr(v),
            ])
          ),
        },
      } as Closure),
    Procedure: ({ body }) => lowerExpr(foldProcedureCPS(body)),
    If: ({ cond, then, _else }) =>
      ({
        kind: "If",
        cond: lowerExpr(cond),
        then: lowerExpr(then),
        _else: lowerExpr(_else),
      } as const),
    Compare: ({ op, left, right }) =>
      ({
        kind: "BinaryOp",
        op: op as abstract.BinaryOperator,
        left: lowerExpr(left),
        right: lowerExpr(right),
      } as const),
    Void: (v) => v,
    "@hole": (): never => {
      throw new Error("encountered a hole in the program");
    },
  });
}

function lower(i: surface.Module): CompilerOutput<abstract.Module> {
  const definitions: Array<{
    name: string;
    value: abstract.Expression;
  }> = [];

  for (const glb of i.globals) {
    try {
      match(glb, {
        Main({ body }) {
          definitions.push({
            name: "__start",
            value: lowerExpr({
              kind: "Call",
              callee: body,
              parameters: [
                {
                  kind: "Void",
                },
                {
                  kind: "Closure",
                  parameters: ["__world"],
                  body: {
                    kind: "Name",
                    name: "__world",
                  },
                },
              ],
            }),
          });
        },
        Define({ name, value }) {
          definitions.push({
            name,
            value: lowerExpr(value),
          });
        },
        DefineFunction({ name, parameters, body }) {
          definitions.push({
            name,
            value: curry(parameters, body),
          });
        },
      });
    } catch (e) {
      return error(e as any);
    }
  }

  return ok({
    definitions,
  });
}

export function createLoweringCompiler(): Compiler<surface.Module, abstract.Module> {
  return new Compiler({
    run: lower,
  });
}
