// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as abstract from "@serendipity/syntax-abstract";
import * as surface from "@serendipity/syntax-surface";

import { lowerExpr } from ".";

/**
 * Create a curried function for a given set of parameters and a function body
 *
 * @param parameters the parameters to curry (may be empty)
 * @param body the body that results from the calling of the closure with all parameters
 */
export function curry(
  parameters: string[],
  body: surface.expression.Expression
): abstract.Closure {
  let val: abstract.Closure;

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
 * Constructor for the classic fixed-point combinator.
 * Recursively binds `c` to itself.
 *
 * @param c The lambda to bind into the Y combinator for external renaming
 */
export function Y(c: abstract.Closure): abstract.Call {
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
