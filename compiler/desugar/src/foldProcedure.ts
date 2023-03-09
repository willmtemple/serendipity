// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as newSurface from "@serendipity/parser";

import { match } from "omnimatch";
import { ParseNode } from "@serendipity/parser";

const internalNames = {
  k: "__k",
  world: "__world",
  break: "__break",
  loop: "__loop",
  it: "__iter",
  next: "__next",
  continue: "__continue",
};

type FunctionExpr = newSurface.FunctionExpression;

// #region A horrible hack that has invaded my code

export function synthesizeParseNode<V>(value: V, inherits?: ParseNode<unknown>): ParseNode<V> {
  return {
    hasError: false,
    range: inherits?.range ?? [
      { absolute: 0, column: 0, line: 0 },
      { absolute: 0, line: 0, column: 0 },
    ],
    value,
  };
}

export function synthesizeParseNodes<Args extends unknown[]>(
  args: Args
): ParseNode<{ [K in keyof Args]: ParseNode<Args[K]> }> {
  return synthesizeParseNode(args.map((v) => synthesizeParseNode(v))) as never;
}

// #endregion

/**
 * Constructor for reserved names.
 *
 * @param name The name to transform
 */
export function res(name: keyof typeof internalNames): newSurface.NameExpression {
  return Object.assign(
    [internalNames[name]] as [string],
    {
      kind: "Name",
    } as const
  );
}

const cpsClosParams = [internalNames.world, internalNames.k].map((v) =>
  synthesizeParseNode({
    name: synthesizeParseNode(v)
  })
);

function cpsClosed(body: newSurface.Expression): FunctionExpr {
  return {
    kind: "Function",
    arrowToken: synthesizeParseNode("->"),
    fnKeyword: synthesizeParseNode("fn"),
    parameters: synthesizeParseNode(cpsClosParams),
    body: synthesizeParseNode(body),
  };
}

function cpsContinue(continuation: newSurface.Expression): FunctionExpr {
  return {
    kind: "Function",
    arrowToken: synthesizeParseNode("->"),
    fnKeyword: synthesizeParseNode("fn"),
    parameters: synthesizeParseNode([synthesizeParseNode({
      name: synthesizeParseNode(internalNames.world)
    })]),
    body: synthesizeParseNode({
      kind: "Call",
      callee: synthesizeParseNode(continuation),
      parameters: synthesizeParseNodes([res("world"), res("k")]),
    }),
  };
}

function getStatementCPS(
  s: newSurface.Statement,
  continuation: newSurface.Expression
): FunctionExpr {
  return (
    match(s, {
      // (\ (w k) (body w (\ w (continuation w k))))
      Do: ([body]): FunctionExpr =>
        cpsClosed({
          kind: "Call",
          callee: body,
          parameters: synthesizeParseNodes([res("world"), cpsContinue(continuation)]),
        }),
      // (\ (w k) (_prn value (continuation w k)))
      // I removed this a while ago but I'm keeping it around as an example.
      // The print statement has been implemented as a core function __core.print_stmt, and that function "participates"
      // in the CPS scheme. It binds its first argument and calls it as a continuation after printing its argument.
      // Print: ({ }): FunctionExpr =>
      //   cpsClosed({
      //     kind: "Call",
      //     callee: {
      //       kind: "Name",
      //       name: "__core.print_stmt",
      //     },
      //     parameters: [
      //       {
      //         kind: "Call",
      //         callee: continuation,
      //         parameters: [res("world"), res("k")],
      //       },
      //       value,
      //     ],
      //   }),
      If: ({ condition, then, Else: elseStmt }): FunctionExpr => {
        const doContinue: newSurface.Expression = {
          kind: "Call",
          callee: synthesizeParseNode(res("next")),
          parameters: synthesizeParseNode([synthesizeParseNode(res("world"))]),
        };
        const nextContinuation = cpsClosed(doContinue);

        const _else: newSurface.Expression = elseStmt
          ? {
              kind: "Call",
              callee: synthesizeParseNode(getStatementCPS(elseStmt.value, nextContinuation)),
              parameters: synthesizeParseNodes([res("world"), res("k")]),
            }
          : doContinue;

        const _if: newSurface.IfExpression = {
          kind: "If",
          ifKeyword: synthesizeParseNode("if"),
          elseKeyword: synthesizeParseNode("else"),
          thenKeyword: synthesizeParseNode("then"),
          condition,
          then: synthesizeParseNode({
            kind: "Call",
            callee: synthesizeParseNode(getStatementCPS(then.value, nextContinuation)),
            parameters: synthesizeParseNodes([res("world"), res("k")]),
          }),
          Else: synthesizeParseNode(_else),
        };

        return cpsClosed({
          kind: "Call",
          callee: synthesizeParseNode({
            kind: "Function",
            arrowToken: synthesizeParseNode("->"),
            fnKeyword: synthesizeParseNode("fn"),
            parameters: synthesizeParseNode([synthesizeParseNode({
              name: synthesizeParseNode(internalNames.next)
            })]),
            body: synthesizeParseNode(_if),
          }),
          parameters: synthesizeParseNode([
            synthesizeParseNode({
              kind: "Function",
              arrowToken: synthesizeParseNode("->"),
              fnKeyword: synthesizeParseNode("fn"),
              parameters: synthesizeParseNode([synthesizeParseNode({
                name: synthesizeParseNode(internalNames.world)
              })]),
              body: synthesizeParseNode({
                kind: "Call",
                callee: synthesizeParseNode(continuation),
                parameters: synthesizeParseNodes([res("world"), res("k")]),
              }),
            }),
          ]),
        });
      },
      Break: (_): FunctionExpr =>
        cpsClosed({
          kind: "Call",
          callee: synthesizeParseNode(res("break")),
          parameters: synthesizeParseNodes([res("world")]),
        }),
      Continue: (_): FunctionExpr =>
        cpsClosed({
          kind: "Call",
          callee: synthesizeParseNode(res("continue")),
          parameters: synthesizeParseNodes([res("world")]),
        }),
      Forever: ([body]): FunctionExpr => {
        const invoker: newSurface.CallExpression = {
          kind: "Call",
          callee: synthesizeParseNode(
            getStatementCPS(
              body.value,
              cpsClosed({
                kind: "Call",
                callee: synthesizeParseNode(res("loop")),
                parameters: synthesizeParseNodes([res("world")]),
              })
            )
          ),
          parameters: synthesizeParseNodes([res("world"), res("k")]),
        };

        let asg: newSurface.Assignment = {
          symbol: synthesizeParseNode(internalNames.loop),
          equalToken: synthesizeParseNode("="),
          value: synthesizeParseNode({
            kind: "Function",
            arrowToken: synthesizeParseNode("->"),
            fnKeyword: synthesizeParseNode("fn"),
            body: synthesizeParseNode(invoker),
            parameters: synthesizeParseNodes([{
              name: synthesizeParseNode(internalNames.world)
            }]),
          }),
        };

        return cpsClosed({
          kind: "Call",
          callee: synthesizeParseNode({
            kind: "Function",
            parameters: synthesizeParseNodes([{
              name: synthesizeParseNode(internalNames.break)
            }]),
            arrowToken: synthesizeParseNode("->"),
            fnKeyword: synthesizeParseNode("fn"),
            body: synthesizeParseNode({
              kind: "With",
              withKeyword: synthesizeParseNode("with"),
              bindings: synthesizeParseNodes([asg]),
              body: synthesizeParseNode({
                kind: "Call",
                callee: synthesizeParseNode(res("loop")),
                parameters: synthesizeParseNodes([res("world")]),
              }),
            }),
          }),
          parameters: synthesizeParseNodes([
            {
              kind: "Function",
              fnKeyword: synthesizeParseNode("fn"),
              arrowToken: synthesizeParseNode("->"),
              parameters: synthesizeParseNodes([{
                name: synthesizeParseNode(internalNames.world)
              }]),
              body: synthesizeParseNode({
                kind: "Call",
                callee: synthesizeParseNode(continuation),
                parameters: synthesizeParseNodes([res("world"), res("k")]),
              }),
            },
          ]),
        });
      },
      ForIn: ({ binding, iterator, body }): FunctionExpr => {
        // LOOP INVOKER
        const invoker: newSurface.CallExpression = {
          kind: "Call",
          callee: synthesizeParseNode({
            kind: "Function",
            arrowToken: synthesizeParseNode("->"),
            fnKeyword: synthesizeParseNode("fn"),
            parameters: synthesizeParseNodes([{
              name: synthesizeParseNode(binding.value)
            }]),
            body: synthesizeParseNode({
              kind: "Call",
              callee: synthesizeParseNode(
                getStatementCPS(
                  body.value,
                  // CONTINUATION of statement: call LOOP again with ITER[1], __world
                  cpsClosed({
                    kind: "Call",
                    callee: synthesizeParseNode(res("loop")),
                    parameters: synthesizeParseNodes([
                      {
                        kind: "Accessor",
                        accessee: synthesizeParseNode(res("it")),
                        index: synthesizeParseNode(
                          Object.assign(
                            ["1"] as [string],
                            {
                              kind: "Number",
                            } as const
                          )
                        ),
                      },
                      res("world"),
                    ]),
                  })
                )
              ),
              parameters: synthesizeParseNodes([res("world"), res("k")]),
            }),
          }),
          // BIND ITER[0] TO binding in loop body invocation
          parameters: synthesizeParseNodes([
            {
              kind: "Accessor",
              accessee: synthesizeParseNode(res("it")),
              index: synthesizeParseNode(
                Object.assign(
                  ["0"] as [string],
                  {
                    kind: "Number",
                  } as const
                )
              ),
            },
          ]),
        };

        // LOOP BODY DEFINITION
        const asg: newSurface.Assignment = {
          symbol: synthesizeParseNode(internalNames.loop),
          equalToken: synthesizeParseNode("="),
          value: synthesizeParseNode({
            kind: "Function",
            arrowToken: synthesizeParseNode("->"),
            fnKeyword: synthesizeParseNode("fn"),
            parameters: synthesizeParseNodes([
              {
                name: synthesizeParseNode(internalNames.it)
              },
              {
                name: synthesizeParseNode(internalNames.world)
              }
            ]),
            body: synthesizeParseNode({
              kind: "If",
              ifKeyword: synthesizeParseNode("if"),
              thenKeyword: synthesizeParseNode("then"),
              elseKeyword: synthesizeParseNode("else"),
              condition: synthesizeParseNode({
                kind: "Compare",
                operator: synthesizeParseNode({
                  kind: "Equal",
                }),
                left: synthesizeParseNode(res("it")),
                right: synthesizeParseNode({ kind: "None" }),
              }),
              then: synthesizeParseNode({
                kind: "Call",
                callee: synthesizeParseNode(res("break")),
                parameters: synthesizeParseNodes([res("world")]),
              }),
              Else: synthesizeParseNode(invoker),
            }),
          }),
        };

        return cpsClosed({
          kind: "Call",
          callee: synthesizeParseNode({
            kind: "Function",
            arrowToken: synthesizeParseNode("->"),
            fnKeyword: synthesizeParseNode("fn"),
            parameters: synthesizeParseNodes([{
              name: synthesizeParseNode(internalNames.break)
            }]),

            // RECURSIVELY BIND LOOP BODY AS "LOOP"
            body: synthesizeParseNode({
              kind: "With",
              withKeyword: synthesizeParseNode("with"),
              bindings: synthesizeParseNodes([asg]),
              body: synthesizeParseNode({
                kind: "Call",
                callee: synthesizeParseNode(res("loop")),
                // Bootstrap loop with
                parameters: synthesizeParseNode([iterator, synthesizeParseNode(res("world"))]),
              }),
            }),
          }),

          // "BREAK" defined: call continuation with __world __k
          parameters: synthesizeParseNodes([
            {
              kind: "Function",
              parameters: synthesizeParseNodes([{
                name: synthesizeParseNode(internalNames.world)
              }]),
              arrowToken: synthesizeParseNode("->"),
              fnKeyword: synthesizeParseNode("fn"),
              body: synthesizeParseNode({
                kind: "Call",
                callee: synthesizeParseNode(continuation),
                parameters: synthesizeParseNodes([res("world"), res("k")]),
              }),
            },
          ]),
        });
      },
      Expression: ([expr]) => {
        // \(w k) (expr ? (cont w k) : (cont w k))

        // for lack of expr.force
        return cpsClosed({
          kind: "If",
          ifKeyword: synthesizeParseNode("if"),
          thenKeyword: synthesizeParseNode("then"),
          elseKeyword: synthesizeParseNode("else"),
          condition: expr,
          // Do the same thing in the if and else case to force evaluation
          // TODO: need a `force` node
          then: synthesizeParseNode({
            kind: "Call",
            callee: synthesizeParseNode(continuation),
            parameters: synthesizeParseNodes([res("world"), res("k")]),
          }),
          Else: synthesizeParseNode({
            kind: "Call",
            callee: synthesizeParseNode(continuation),
            parameters: synthesizeParseNodes([res("world"), res("k")]),
          }),
        });
      },
      Pass: () => {
        // Probably the easiest one to do.
        return cpsClosed({
          kind: "Call",
          callee: synthesizeParseNode(continuation),
          parameters: synthesizeParseNodes([res("world"), res("k")]),
        });
      },
    }) ??
    (() => {
      throw new Error("Not implemented: " + s.kind);
    })()
  );
}

/**
 * Reduction from stateful procedures to a pure function of a
 * single argument using Continuation-passing style.
 *
 * @param body The list of statements to fold into an expression
 */
export function foldProcedureCPS(procBody: newSurface.Statement[]): newSurface.Expression {
  let tail: newSurface.Expression = cpsClosed({
    kind: "Call",
    callee: synthesizeParseNode(res("k")),
    parameters: synthesizeParseNode([synthesizeParseNode(res("world"))]),
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
