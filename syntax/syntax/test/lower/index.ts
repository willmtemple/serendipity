// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as abstract from "@serendipity/syntax-abstract";

import { Compiler, CompilerOutput } from "../../lib/compiler";
import * as surface from "../../lib/lang/syntax/surface";
import { ok, error } from "../../lib/util/Result";

type SExpression = surface.expression.Expression;
type AbsExpression = abstract.expression.Expression;

function _curry(parameters: string[], body: SExpression): AbsExpression {
  let val: AbsExpression;

  if (parameters.length === 0) {
    // No parameter for this closure
    val = {
      exprKind: "closure",
      body: lowerExpr(body)
    };
  } else {
    // Curry the paramters into separate closures.
    for (const p of parameters) {
      val = {
        exprKind: "closure",
        parameter: p,
        // Stack the closures
        body: val || lowerExpr(body)
      };
    }
  }

  return val;
}

/**
 * Fixed-point Y Combinator constructor function, used to recursively bind `c` to itself
 * @param c The lambda to bind into the y combinator for external renaming
 */
function Y(c: abstract.expression.Closure): abstract.expression.Call {
  return {
    exprKind: "call",
    parameter: c,
    callee: {
      exprKind: "closure",
      parameter: "f",
      body: {
        exprKind: "call",
        callee: {
          exprKind: "closure",
          parameter: "x",
          body: {
            exprKind: "call",
            callee: {
              exprKind: "name",
              name: "x"
            },
            parameter: {
              exprKind: "name",
              name: "x"
            }
          }
        },
        parameter: {
          exprKind: "closure",
          parameter: "x",
          body: {
            exprKind: "call",
            callee: {
              exprKind: "name",
              name: "f"
            },
            parameter: {
              exprKind: "call",
              callee: {
                exprKind: "name",
                name: "x"
              },
              parameter: {
                exprKind: "name",
                name: "x"
              }
            }
          }
        }
      }
    }
  };
}

type SStatement = surface.statement.Statement;
type AbsStatement = abstract.statement.Statement;

function lowerStatement(s: SStatement): AbsStatement {
  return surface.statement.matchStatement<AbsStatement>({
    Print: ({ value }) => ({
      statementKind: "print",
      value: lowerExpr(value)
    }),
    Let: ({ name, value }) => ({
      statementKind: "let",
      name,
      value: lowerExpr(value)
    }),
    If: ({ condition, body, _else }) => ({
      statementKind: "if",
      condition: lowerExpr(condition),
      body: lowerStatement(body),
      _else: _else && lowerStatement(_else)
    }),
    ForIn: ({ binding, value, body }) => ({
      statementKind: "forin",
      binding,
      value: lowerExpr(value),
      body: lowerStatement(body)
    }),
    Forever: ({ body }) => ({
      statementKind: "forever",
      body: lowerStatement(body)
    }),
    Do: ({ body }) => ({
      statementKind: "do",
      body: lowerExpr(body)
    }),
    Break: (b) => b,
    Default: (_) => {
      throw new Error("not implemented");
    }
  })(s);
}

function lowerExpr(e: SExpression): AbsExpression {
  return surface.expression.matchExpression<AbsExpression>({
    Number: (n) => n,
    String: (s) => s,
    Name: (n) => n,
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
    Closure: ({ parameters, body }) => _curry(parameters, body),
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
    Procedure: ({ body }) => ({ exprKind: "procedure", body: body.map(lowerStatement) }),
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
    },
    Default: (_) => {
      throw new Error("not implemented");
    }
  })(e);
}

type SGlobal = surface.global.Global;
type AbsGlobal = abstract.global.Global;

function lowerGlobal(g: SGlobal): AbsGlobal {
  return surface.global.matchGlobal<AbsGlobal>({
    Main: ({ body }) => ({
      globalKind: "main",
      body: lowerExpr(body)
    }),
    Define: ({ name, value }) => ({
      globalKind: "define",
      name,
      value: lowerExpr(value)
    }),
    DefineFunction: ({ name, parameters, body }) => {
      return {
        globalKind: "define",
        name,
        value: _curry(parameters, body)
      };
    }
  })(g);
}

function lower(i: surface.Module): CompilerOutput<abstract.Module> {
  try {
    return ok({
      globals: i.globals.map(lowerGlobal)
    });
  } catch (e) {
    return error(e);
  }
}

export function createLoweringCompiler(): Compiler<surface.Module, abstract.Module> {
  return new Compiler({
    run: lower
  });
}
