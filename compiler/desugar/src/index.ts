// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as abstract from "@serendipity/syntax-abstract";

import { Compiler, CompilerOutput } from "@serendipity/syntax";
import * as surface from "@serendipity/syntax-surface";
import { ok, error } from "@serendipity/syntax/dist/util/Result";

import { curry, Y } from "./util";
import { foldProcedureCPS } from "./foldProcedure";

// Rename for convenience
const { matchGlobal } = surface.global;

type SExpression = surface.expression.Expression;
type AbsExpression = abstract.expression.Expression;

export function lowerExpr(e: SExpression): AbsExpression {
  return surface.expression.matchExpression<AbsExpression>({
    Number: (n) => n,
    String: (s) => s,
    Name: (n) => n,
    Boolean: (b) => b,
    Accessor: ({ accessee, index }) => ({
      exprKind: "accessor",
      accessee: lowerExpr(accessee),
      index: lowerExpr(index)
    }),
    Arithmetic: ({ op, left, right }) => ({
      exprKind: "binop",
      op: op as abstract.expression.BinaryOperator,
      left: lowerExpr(left),
      right: lowerExpr(right)
    }),
    With: ({ binding, expr }) => {
      // Use a Y combinator to get letrec semantics

      const almost: AbsExpression = {
        exprKind: "closure",
        parameter: binding[0],
        body: lowerExpr(binding[1])
      };

      return {
        exprKind: "call",
        callee: {
          exprKind: "closure",
          parameter: binding[0],
          body: lowerExpr(expr)
        },
        parameter: Y(almost)
      };
    },
    Call: ({ callee, parameters }) => {
      const calleeLowered = lowerExpr(callee);
      if (parameters.length === 0) {
        return {
          exprKind: "call",
          callee: calleeLowered
        };
      } else {
        let call: AbsExpression;
        for (let i = parameters.length - 1; i >= 0; i--) {
          call = {
            exprKind: "call",
            callee: call || calleeLowered,
            parameter: lowerExpr(parameters[i])
          };
        }
        return call;
      }
    },
    Closure: ({ parameters, body }) => curry(parameters, body),
    List: ({ contents }) => {
      let list: AbsExpression = {
        exprKind: "void"
      };

      for (let i = contents.length - 1; i >= 0; i--) {
        list = {
          exprKind: "tuple",
          values: [lowerExpr(contents[i]), list]
        };
      }

      return list;
    },
    Tuple: ({ values }) => ({ exprKind: "tuple", values: values.map(lowerExpr) }),
    Procedure: ({ body }) => lowerExpr(foldProcedureCPS(body)),
    If: ({ cond, then, _else }) => ({
      exprKind: "if",
      cond: lowerExpr(cond),
      then: lowerExpr(then),
      _else: lowerExpr(_else)
    }),
    Compare: ({ op, left, right }) => ({
      exprKind: "binop",
      op: op as abstract.expression.BinaryOperator,
      left: lowerExpr(left),
      right: lowerExpr(right)
    }),
    Void: (v) => v,
    Hole: () => {
      throw new Error("encountered a hole in the program");
    }
  })(e);
}

function lower(i: surface.Module): CompilerOutput<abstract.Module> {
  const definitions: Array<{
    name: string;
    value: AbsExpression;
  }> = [];

  for (const glb of i.globals) {
    try {
      matchGlobal({
        Main({ body }) {
          definitions.push({
            name: "__start",
            value: lowerExpr({
              exprKind: "call",
              callee: body,
              parameters: [
                {
                  exprKind: "void"
                },
                {
                  exprKind: "closure",
                  parameters: [" w"],
                  body: {
                    exprKind: "name",
                    name: " w"
                  }
                }
              ]
            })
          });
        },
        Define({ name, value }) {
          definitions.push({
            name,
            value: lowerExpr(value)
          });
        },
        DefineFunction({ name, parameters, body }) {
          definitions.push({
            name,
            value: curry(parameters, body)
          });
        }
      })(glb);
    } catch (e) {
      return error(e);
    }
  }

  return ok({
    definitions
  });
}

export function createLoweringCompiler(): Compiler<surface.Module, abstract.Module> {
  return new Compiler({
    run: lower
  });
}
