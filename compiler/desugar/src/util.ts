// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as abstract from "@serendipity/syntax-abstract";

/**
 * Constructor for the classic fixed-point combinator.
 * Recursively binds `c` to itself.
 *
 * (fn(f) -> fn(x) -> x(x))(.)
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
              name: "x",
            },
            parameter: {
              kind: "Name",
              name: "x",
            },
          },
        },
        parameter: {
          kind: "Closure",
          parameter: "x",
          body: {
            kind: "Call",
            callee: {
              kind: "Name",
              name: "f",
            },
            parameter: {
              kind: "Call",
              callee: {
                kind: "Name",
                name: "x",
              },
              parameter: {
                kind: "Name",
                name: "x",
              },
            },
          },
        },
      },
    },
  };
}
