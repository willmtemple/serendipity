// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as surface from "@serendipity/syntax-surface";

import { match } from "omnimatch";

const internalNames = {
  k: "__k",
  world: "__world",
  break: "__break",
  loop: "__loop",
  it: "__iter",
  next: "__next"
};

type Expression = surface.Expression;
type Closure = surface.Closure;

/**
 * Constructor for reserved names.
 *
 * @param name The name to transform
 */
export function res(name: keyof typeof internalNames): surface.Name {
  return {
    kind: "Name",
    name: internalNames[name]
  };
}

const cpsClosParams = [internalNames.world, internalNames.k];

function cpsClosed(body: Expression): Closure {
  return {
    kind: "Closure",
    parameters: cpsClosParams,
    body
  };
}

function cpsContinue(continuation: Expression): Closure {
  return {
    kind: "Closure",
    parameters: [internalNames.world],
    body: {
      kind: "Call",
      callee: continuation,
      parameters: [res("world"), res("k")]
    }
  };
}

function getStatementCPS(s: surface.Statement, continuation: Expression): Closure {
  return match(s, {
    // (\ (w k) (body w (\ w (continuation w k))))
    Do: ({ body }): Closure =>
      cpsClosed({
        kind: "Call",
        callee: body,
        parameters: [res("world"), cpsContinue(continuation)]
      }),
    // (\ (w k) (_prn value (continuation w k)))
    Print: ({ value }): Closure =>
      cpsClosed({
        kind: "Call",
        callee: {
          kind: "Name",
          name: "__core.print_stmt"
        },
        parameters: [
          {
            kind: "Call",
            callee: continuation,
            parameters: [res("world"), res("k")]
          },
          value
        ]
      }),
    If: ({ condition, body, _else: elseStmt }): Closure => {
      const doContinue: Expression = {
        kind: "Call",
        callee: res("next"),
        parameters: [res("world")]
      };
      const nextContinuation: Expression = {
        kind: "Closure",
        parameters: cpsClosParams,
        body: doContinue
      };

      const _else: Expression = elseStmt
        ? {
            kind: "Call",
            callee: getStatementCPS(elseStmt, nextContinuation),
            parameters: [res("world"), res("k")]
          }
        : doContinue;

      return cpsClosed({
        kind: "Call",
        callee: {
          kind: "Closure",
          parameters: [internalNames.next],
          body: {
            kind: "If",
            cond: condition,
            then: {
              kind: "Call",
              callee: getStatementCPS(body, nextContinuation),
              parameters: [res("world"), res("k")]
            },
            _else
          }
        },
        parameters: [
          {
            kind: "Closure",
            parameters: [internalNames.world],
            body: {
              kind: "Call",
              callee: continuation,
              parameters: [res("world"), res("k")]
            }
          }
        ]
      });
    },
    Break: (_): Closure =>
      cpsClosed({
        kind: "Call",
        callee: res("break"),
        parameters: [res("world")]
      }),
    Forever: ({ body }): Closure => {
      const invoker: surface.Call = {
        kind: "Call",
        callee: getStatementCPS(
          body,
          cpsClosed({
            kind: "Call",
            callee: res("loop"),
            parameters: [res("world")]
          })
        ),
        parameters: [res("world"), res("k")]
      };
      return cpsClosed({
        kind: "Call",
        callee: {
          kind: "Closure",
          parameters: [internalNames.break],
          body: {
            kind: "With",
            binding: [
              internalNames.loop,
              {
                kind: "Closure",
                parameters: [internalNames.world],
                body: invoker
              }
            ],
            expr: {
              kind: "Call",
              callee: res("loop"),
              parameters: [res("world")]
            }
          }
        },
        parameters: [
          {
            kind: "Closure",
            parameters: [internalNames.world],
            body: {
              kind: "Call",
              callee: continuation,
              parameters: [res("world"), res("k")]
            }
          }
        ]
      });
    },
    ForIn: ({ binding, value, body }): Closure => {
      const invoker: surface.Call = {
        kind: "Call",
        callee: {
          kind: "Closure",
          parameters: [binding],
          body: {
            kind: "Call",
            callee: getStatementCPS(
              body,
              cpsClosed({
                kind: "Call",
                callee: res("loop"),
                parameters: [
                  {
                    kind: "Accessor",
                    accessee: res("it"),
                    index: {
                      kind: "Number",
                      value: 1
                    }
                  },
                  res("world")
                ]
              })
            ),
            parameters: [res("world"), res("k")]
          }
        },
        parameters: [
          {
            kind: "Accessor",
            accessee: res("it"),
            index: {
              kind: "Number",
              value: 0
            }
          }
        ]
      };
      return cpsClosed({
        kind: "Call",
        callee: {
          kind: "Closure",
          parameters: [internalNames.break],
          body: {
            kind: "With",
            binding: [
              internalNames.loop,
              {
                kind: "Closure",
                parameters: [internalNames.it, internalNames.world],
                body: {
                  kind: "If",
                  cond: {
                    kind: "Compare",
                    op: "==",
                    left: res("it"),
                    right: { kind: "Void" }
                  },
                  then: {
                    kind: "Call",
                    callee: res("break"),
                    parameters: [res("world")]
                  },
                  _else: invoker
                }
              }
            ],
            expr: {
              kind: "Call",
              callee: res("loop"),
              parameters: [value, res("world")]
            }
          }
        },
        parameters: [
          {
            kind: "Closure",
            parameters: [internalNames.world],
            body: {
              kind: "Call",
              callee: continuation,
              parameters: [res("world"), res("k")]
            }
          }
        ]
      });
    }
  }) ?? (() => { throw new Error("Not implemented: " + s.kind); })();
}

/**
 * Reduction from stateful procedures to a pure function of a
 * single argument using Continuation-passing style.
 *
 * @param body The list of statements to fold into an expression
 */
export function foldProcedureCPS(procBody: surface.Statement[]): Closure {
  let tail: Expression = cpsClosed({
    kind: "Call",
    callee: res("k"),
    parameters: [res("world")]
  });

  for (const stmt of procBody.reverse()) {
    tail = getStatementCPS(stmt, tail);
  }

  return tail;
}

/* TODO: following statements

function lowerStatement(s: SStatement): AbsStatement {
  return surface.statement.matchStatement<AbsStatement>({
    Let: ({ name, value }) => ({
      statementKind: "let",
      name,
      value: lowerExpr(value)
    }),
    Set: ({ name, value }) => ({
      statementKind: "set",
      name,
      value: lowerExpr(value)
    })
  })(s);
}*/
