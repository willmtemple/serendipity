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
export function curry(parameters: string[], body: surface.Expression): abstract.Closure {
  let val: abstract.Closure | undefined = undefined;

  if (parameters.length === 0) {
    // No parameter for this closure
    val = {
      kind: "Closure",
      body: lowerExpr(body)
    };
  } else {
    // Curry the paramters into separate closures.
    for (const p of parameters) {
      val = {
        kind: "Closure",
        parameter: p,
        // Stack the closures
        body: val ?? lowerExpr(body)
      };
    }
  }

  return val as abstract.Closure;
}

/**
 * Constructor for the classic fixed-point combinator.
 * Recursively binds `c` to itself.
 *
 * @param c The lambda to bind into the Y combinator for external renaming
 */
export function Y(c: abstract.Closure): abstract.Call {
  return {
    kind: "Call",
    parameter: c,
    callee: {
      kind: "Closure",
      parameter: "f",
      body: {
        kind: "Call",
        callee: {
          kind: "Closure",
          parameter: "x",
          body: {
            kind: "Call",
            callee: {
              kind: "Name",
              name: "x"
            },
            parameter: {
              kind: "Name",
              name: "x"
            }
          }
        },
        parameter: {
          kind: "Closure",
          parameter: "x",
          body: {
            kind: "Call",
            callee: {
              kind: "Name",
              name: "f"
            },
            parameter: {
              kind: "Call",
              callee: {
                kind: "Name",
                name: "x"
              },
              parameter: {
                kind: "Name",
                name: "x"
              }
            }
          }
        }
      }
    }
  };
}
