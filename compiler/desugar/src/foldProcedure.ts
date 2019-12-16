// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as surface from "@serendipity/syntax-surface";

const { matchStatement } = surface.statement;

type Closure = surface.expression.Closure;
type Statement = surface.statement.Statement;
type Expression = surface.expression.Expression;

const internalNames = {
  k: " k",
  world: " w",
  break: " b",
  loop: " l",
  it: " it",
  next: " next"
};

/**
 * Constructor for reserved names.
 *
 * @param name The name to transform
 */
export function res(name: keyof typeof internalNames): surface.expression.Name {
  return {
    exprKind: "name",
    name: internalNames[name]
  };
}

const cpsClosParams = [internalNames.world, internalNames.k];

function cpsClosed(body: Expression): Closure {
  return {
    exprKind: "closure",
    parameters: cpsClosParams,
    body
  };
}

function cpsContinue(continuation: Expression): Closure {
  return {
    exprKind: "closure",
    parameters: [internalNames.world],
    body: {
      exprKind: "call",
      callee: continuation,
      parameters: [res("world"), res("k")]
    }
  };
}

function getStatementCPS(s: Statement, continuation: Expression): Closure {
  return matchStatement({
    // (\ (w k) (body w (\ w (continuation w k))))
    Do: ({ body }) =>
      cpsClosed({
        exprKind: "call",
        callee: body,
        parameters: [res("world"), cpsContinue(continuation)]
      }),
    // (\ (w k) (_prn value (continuation w k)))
    Print: ({ value }) =>
      cpsClosed({
        exprKind: "call",
        callee: {
          exprKind: "name",
          name: "__core.print_stmt"
        },
        parameters: [
          {
            exprKind: "call",
            callee: continuation,
            parameters: [res("world"), res("k")]
          },
          value
        ]
      }),
    If: ({ condition, body, _else: elseStmt }) => {
      const doContinue: Expression = {
        exprKind: "call",
        callee: res("next"),
        parameters: [res("world")]
      };
      const nextContinuation: Expression = {
        exprKind: "closure",
        parameters: cpsClosParams,
        body: doContinue
      };

      const _else: Expression = elseStmt
        ? {
            exprKind: "call",
            callee: getStatementCPS(elseStmt, nextContinuation),
            parameters: [res("world"), res("k")]
          }
        : doContinue;

      return cpsClosed({
        exprKind: "call",
        callee: {
          exprKind: "closure",
          parameters: [internalNames.next],
          body: {
            exprKind: "if",
            cond: condition,
            then: {
              exprKind: "call",
              callee: getStatementCPS(body, nextContinuation),
              parameters: [res("world"), res("k")]
            },
            _else
          }
        },
        parameters: [
          {
            exprKind: "closure",
            parameters: [internalNames.world],
            body: {
              exprKind: "call",
              callee: continuation,
              parameters: [res("world"), res("k")]
            }
          }
        ]
      });
    },
    Break: (_) =>
      cpsClosed({
        exprKind: "call",
        callee: res("break"),
        parameters: [res("world")]
      }),
    Forever: ({ body }) => {
      const invoker: surface.expression.Call = {
        exprKind: "call",
        callee: getStatementCPS(
          body,
          cpsClosed({
            exprKind: "call",
            callee: res("loop"),
            parameters: [res("world")]
          })
        ),
        parameters: [res("world"), res("k")]
      };
      return cpsClosed({
        exprKind: "call",
        callee: {
          exprKind: "closure",
          parameters: [internalNames.break],
          body: {
            exprKind: "with",
            binding: [
              internalNames.loop,
              {
                exprKind: "closure",
                parameters: [internalNames.world],
                body: invoker
              }
            ],
            expr: {
              exprKind: "call",
              callee: res("loop"),
              parameters: [res("world")]
            }
          }
        },
        parameters: [
          {
            exprKind: "closure",
            parameters: [internalNames.world],
            body: {
              exprKind: "call",
              callee: continuation,
              parameters: [res("world"), res("k")]
            }
          }
        ]
      });
    },
    ForIn: ({ binding, value, body }) => {
      const invoker: surface.expression.Call = {
        exprKind: "call",
        callee: {
          exprKind: "closure",
          parameters: [binding],
          body: {
            exprKind: "call",
            callee: getStatementCPS(
              body,
              cpsClosed({
                exprKind: "call",
                callee: res("loop"),
                parameters: [
                  {
                    exprKind: "accessor",
                    accessee: res("it"),
                    index: {
                      exprKind: "number",
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
            exprKind: "accessor",
            accessee: res("it"),
            index: {
              exprKind: "number",
              value: 0
            }
          }
        ]
      };
      return cpsClosed({
        exprKind: "call",
        callee: {
          exprKind: "closure",
          parameters: [internalNames.break],
          body: {
            exprKind: "with",
            binding: [
              internalNames.loop,
              {
                exprKind: "closure",
                parameters: [internalNames.it, internalNames.world],
                body: {
                  exprKind: "if",
                  cond: {
                    exprKind: "compare",
                    op: "==",
                    left: res("it"),
                    right: { exprKind: "void" }
                  },
                  then: {
                    exprKind: "call",
                    callee: res("break"),
                    parameters: [res("world")]
                  },
                  _else: invoker
                }
              }
            ],
            expr: {
              exprKind: "call",
              callee: res("loop"),
              parameters: [value, res("world")]
            }
          }
        },
        parameters: [
          {
            exprKind: "closure",
            parameters: [internalNames.world],
            body: {
              exprKind: "call",
              callee: continuation,
              parameters: [res("world"), res("k")]
            }
          }
        ]
      });
    },
    Default(stmt) {
      throw new Error("Not implemented: foldProcedure([...," + stmt.statementKind + "])");
    }
  })(s);
}

/**
 * Reduction from stateful procedures to a pure function of a
 * single argument using Continuation-passing style.
 *
 * @param body The list of statements to fold into an expression
 */
export function foldProcedureCPS(procBody: Statement[]): Closure {
  let tail: Expression = cpsClosed({
    exprKind: "call",
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
