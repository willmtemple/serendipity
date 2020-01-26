// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Module, matchExpression, Expression } from "@serendipity/syntax-abstract";
import { writeAbstract } from "@serendipity/interpreter/dist/print";

type Environment = { [k: string]: number };

export function removeUnusedFunctionCalls(input: Module): Module {
  const startingEnv = {};
  return {
    definitions: input.definitions.map((d) => {
      if (d.name === "__start") {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[deadcode] __start was: ", writeAbstract(d.value));
        }
      }
      return {
        name: d.name,
        value: reduceDeadCode(d.value, startingEnv)
      };
    })
  };
}

function reduceDeadCode(input: Expression, env: Environment): Expression {
  const reduce = (val: Expression): Expression => reduceDeadCode(val, env);
  if (input.metadata === undefined) {
    input.metadata = {};
  }
  return matchExpression<Expression>({
    // Closure and name are the only ones that need to check the env
    Closure: (clos) => {
      clos.metadata.dead = false;
      const saved = env[clos.parameter];
      env[clos.parameter] = 0;
      const body = reduceDeadCode(clos.body, env);
      if (env[clos.parameter] === 0) {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[deadcode] This function is dead: ", writeAbstract(clos));
        }
        clos.metadata.dead = true;
      }
      env[clos.parameter] = saved;

      return {
        ...clos,
        exprKind: "closure",
        body
      };
    },
    Name(n) {
      env[n.name] += 1;
      return n;
    },
    // Simple order 1 exprs
    Accessor: (e) => ({
      ...e,
      exprKind: "accessor",
      accessee: reduce(e.accessee),
      index: reduce(e.index)
    }),
    BinaryOp: (e) => ({
      ...e,
      exprKind: "binop",
      left: reduce(e.left),
      right: reduce(e.right)
    }),
    Call: (e) => {
      const callee = reduce(e.callee);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (callee.exprKind === "closure" && callee.metadata.dead! === true) {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[deadcode] eliminated: ", writeAbstract(e));
        }
        return callee.body;
      } else {
        return {
          ...e,
          exprKind: "call",
          callee,
          parameter: e.parameter && reduce(e.parameter)
        };
      }
    },
    If: (e) => ({
      ...e,
      exprKind: "if",
      cond: reduce(e.cond),
      then: reduce(e.then),
      _else: e._else && reduce(e._else)
    }),
    Tuple: (e) => ({
      ...e,
      exprKind: "tuple",
      values: e.values.map(reduce)
    }),
    // Order 0 values
    Number: (e) => e,
    Boolean: (e) => e,
    String: (e) => e,
    Void: (e) => e
  })(input);
}
