// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Module, Expression } from "@serendipity/syntax-abstract";
import { writeAbstract } from "@serendipity/interpreter/dist-esm/print";

import { match } from "omnimatch";

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
  return match(input, {
    // Closure and name are the only ones that need to check the env
    Closure: (clos): Expression => {
      clos.metadata!.dead = false;
      let saved = undefined;
      if (clos.parameter) {
        saved = env[clos.parameter];
        env[clos.parameter] = 0;
      }
      const body = reduceDeadCode(clos.body, env);
      if (clos.parameter) {
        if (env[clos.parameter] === 0) {
          if (process.env.DEBUG) {
            // eslint-disable-next-line no-console
            console.log("[deadcode] This function is dead: ", writeAbstract(clos));
          }
          clos.metadata!.dead = true;
        }
        if (saved) {
          env[clos.parameter] = saved;
        }
      }

      return {
        ...clos,
        kind: "Closure",
        body
      };
    },
    Name(n): Expression {
      env[n.name] += 1;
      return n;
    },
    // Simple order 1 exprs
    Accessor: (e): Expression => ({
      ...e,
      kind: "Accessor",
      accessee: reduce(e.accessee),
      index: reduce(e.index)
    }),
    BinaryOp: (e): Expression => ({
      ...e,
      kind: "BinaryOp",
      left: reduce(e.left),
      right: reduce(e.right)
    }),
    Call: (e): Expression => {
      const callee = reduce(e.callee);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (callee.kind === "Closure" && callee.metadata?.dead === true) {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[deadcode] eliminated: ", writeAbstract(e));
        }
        return callee.body;
      } else {
        return {
          ...e,
          kind: "Call",
          callee,
          parameter: e.parameter && reduce(e.parameter)
        };
      }
    },
    If: (e): Expression => ({
      ...e,
      kind: "If",
      cond: reduce(e.cond),
      then: reduce(e.then),
      _else: e._else && reduce(e._else)
    }),
    Tuple: (e): Expression => ({
      ...e,
      kind: "Tuple",
      values: e.values.map(reduce)
    }),
    // Order 0 values
    Number: (e): Expression => e,
    Boolean: (e): Expression => e,
    String: (e): Expression => e,
    Void: (e): Expression => e
  });
}
