// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { match } from "omnimatch";

import * as abstract from "@serendipity/syntax-abstract";
import * as surface from "@serendipity/parser";

import { Compiler, CompilerOutput } from "@serendipity/syntax";
import { ok, error } from "@serendipity/syntax/dist-esm/util/Result";

import { Y } from "./util";
import { foldProcedureCPS, synthesizeParseNode, synthesizeParseNodes } from "./foldProcedure";
import { Closure } from "@serendipity/syntax-abstract";

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
      body: lowerExpr(body),
    };
  } else {
    // Curry the paramters into separate closures.
    for (const p of parameters) {
      val = {
        kind: "Closure",
        parameter: p,
        // Stack the closures
        body: val ?? lowerExpr(body),
      };
    }
  }

  return val as abstract.Closure;
}

function getBinaryOp(v: surface.ArithmeticOp | surface.CompareOp): abstract.BinaryOperator {
  return (
    {
      Add: abstract.BinaryOperator.ADD,
      Divide: abstract.BinaryOperator.DIV,
      Equal: abstract.BinaryOperator.EQ,
      GreaterThan: abstract.BinaryOperator.GT,
      GreaterThanOrEqual: abstract.BinaryOperator.GEQ,
      LessThan: abstract.BinaryOperator.LT,
      LessThanOrEqual: abstract.BinaryOperator.LEQ,
      Modulus: abstract.BinaryOperator.MOD,
      Multiply: abstract.BinaryOperator.MUL,
      NotEqual: abstract.BinaryOperator.NEQ,
      Subtract: abstract.BinaryOperator.SUB,
    } as Record<typeof v["kind"], abstract.BinaryOperator>
  )[v.kind];
}

function getUnaryOp(v: surface.UnaryOp): abstract.UnaryOperator {
  return {
    Negate: abstract.UnaryOperator.NEGATE,
    Minus: abstract.UnaryOperator.MINUS,
  }[v.kind];
}

export function lowerExpr(e: surface.Expression): abstract.Expression {
  const m: abstract.Expression = match(e, {
    Number: (n) => ({ kind: "Number", value: parseFloat(n[0]) } as const),
    String: (s) => ({ kind: "String", value: s[0] } as const),
    Boolean: (b) => ({ kind: "Boolean", value: b[0] } as const),
    Name: (n) => ({ kind: "Name", name: n[0] } as const),
    Accessor: ({ accessee, index }) =>
      ({
        kind: "Accessor",
        accessee: lowerExpr(accessee.value),
        index: lowerExpr(index.value),
      } as const),
    Arithmetic: ({ operator, left, right }) =>
      ({
        kind: "BinaryOp",
        op: getBinaryOp(operator.value),
        left: lowerExpr(left.value),
        right: lowerExpr(right.value),
      } as const),
    As: ({ expr }) => lowerExpr(expr.value),
    With: ({ bindings, body }) => {
      // Use a Y combinator to get letrec semantics

      //TODO: new stx allows multiple bindings, need mutual letrec

      const binding = bindings.value[0]?.value;

      const almost: abstract.Expression = {
        kind: "Closure",
        parameter: binding?.symbol.value!,
        body: lowerExpr(binding?.value.value!),
      };

      return {
        kind: "Call",
        callee: {
          kind: "Closure",
          parameter: binding?.symbol.value!,
          body: lowerExpr(body.value),
        },
        parameter: Y(almost),
      } as const;
    },
    Call: ({ callee, parameters }) => {
      const calleeLowered = lowerExpr(callee.value);
      if (parameters.value.length === 0) {
        return {
          kind: "Call",
          callee: calleeLowered,
        } as const;
      } else {
        let call: abstract.Expression | undefined = undefined;
        for (const parameter of parameters.value.reverse()) {
          call = {
            kind: "Call",
            callee: call ?? calleeLowered,
            parameter: lowerExpr(parameter.value),
          };
        }
        return call as abstract.Expression;
      }
    },
    Function: ({ body, parameters }) =>
      curry(
        parameters.value.map((v) => v.value.name.value),
        body.value
      ),
    List: ({ elements }) => {
      let list: abstract.Expression = {
        kind: "Void",
      };

      for (const item of elements.value.reverse()) {
        list = {
          kind: "Tuple",
          values: [lowerExpr(item.value), list],
        };
      }

      return list;
    },
    Tuple: ({ elements }) =>
      ({ kind: "Tuple", values: elements.value.map(({ value }) => lowerExpr(value)) } as const),
    Record: ({ elements }) => {
      // TODO: new stx adds JS-like record features (spread, ident). We are asserting it unused below.
      return createRecord(elements);
    },
    Procedure: ({ body }) => lowerExpr(foldProcedureCPS(body.value.map((v) => v.value))),
    If: ({ condition, then, Else: _else }) =>
      ({
        kind: "If",
        cond: lowerExpr(condition.value),
        then: lowerExpr(then.value),
        _else: lowerExpr(_else.value),
      } as const),
    Compare: ({ operator, left, right }) =>
      ({
        kind: "BinaryOp",
        op: getBinaryOp(operator.value),
        left: lowerExpr(left.value),
        right: lowerExpr(right.value),
      } as const),
    Unary: ({ operator, expression }) =>
      ({
        kind: "UnaryOp",
        op: getUnaryOp(operator.value),
        expr: lowerExpr(expression.value),
      } as const),
    None: () => ({ kind: "Void" } as const),
    Hole: (): never => {
      throw new Error("encountered a hole in the program");
    },
    FieldAccess: ({ accessee, field }) => ({
      kind: "Call",
      callee: lowerExpr(accessee.value),
      parameter: {
        kind: "String",
        value: field.value
      }
    } as abstract.Call)
  });

  return m;
}

function createRecord(elements: surface.ParseNode<surface.ParseNode<surface.RecordElement>[]>): abstract.Closure {
  return {
    kind: "Closure",
    parameter: "__key",
    body: {
      kind: "Case",
      _in: { kind: "Name", name: "__key" },
      cases: new Map(
        elements.value.map(({ value: recordElement }) => match(recordElement, {
          KeyValuePair: ({ key, value }) => [{ kind: "String", value: key.value }, lowerExpr(value.value)],
          Identifier: ({ name }) => [{ kind: "String", value: name.value }, { kind: "Name", name: name.value }],
          Spread: () => {
            throw new Error("not implemented");
          }
        })).filter(x => !!x) as [abstract.Expression, abstract.Expression][]
      ),
    },
  } as Closure;
}

const EXPORT_MAP = new WeakMap<abstract.Module, string[]>();

export function getAssociatedExports(m: abstract.Module): string[] {
  return EXPORT_MAP.get(m) ?? [];
}

export function lowerModule(i: surface.Module): CompilerOutput<abstract.Module> {
  const definitions: Array<{
    name: string;
    value: abstract.Expression;
  }> = [];

  let exports: string[] | undefined;

  for (const glb of i.declarations) {
    try {
      match(glb.value, {
        Main({ body }) {
          definitions.push({
            name: "__start",
            value: lowerExpr({
              kind: "Call",
              callee: body,
              parameters: synthesizeParseNodes([
                {
                  kind: "None",
                } as surface.NoneExpression,
                {
                  kind: "Function",
                  arrowToken: synthesizeParseNode("->"),
                  fnKeyword: synthesizeParseNode("fn"),
                  parameters: synthesizeParseNodes([{
                    name: synthesizeParseNode("__world")
                  }]),
                  body: synthesizeParseNode(
                    Object.assign(["__world"] as [string], {
                      kind: "Name",
                    })
                  ),
                } as surface.FunctionExpression,
              ]),
            }),
          });
        },
        Const({ identifier, value }) {
          definitions.push({
            name: identifier.value,
            value: lowerExpr(value.value),
          });
        },
        Function({ identifier, parameters, body }) {
          definitions.push({
            name: identifier.value,
            value: curry(
              parameters.value.map((v) => v.value.name.value),
              body.value
            ),
          });
        },
        Export({ elements }) {
          if (exports !== undefined) throw new Error("unimplemented: 'export' may only be set once");

          exports = elements.value.map((v) => match(v.value, {
            Identifier: ({ name }) => name.value,
            KeyValuePair: ({ key }) => key.value,
            Spread(_) {
              throw new Error("unimplemented: cannot statically analyze spread in exports")
            }
          }));

          definitions.push({
            name: "__exports",
            value: createRecord(elements),
          })
        },
        Import({ pattern, moduleSpecifier }) {
          const importValue: abstract.Expression = {
            kind: "Call",
            callee: {
              kind: "Accessor",
              accessee: {
                kind: "Name",
                name: "__core"
              },
              index: {
                kind: "String",
                value: "import"
              }
            },
            parameter: {
              kind: "String",
              value: moduleSpecifier.value,
            },
          };
          match(pattern.value, {
            Identifier({ name }) {
              definitions.push({
                name: name.value,
                value: importValue,
              });
            },
            Tuple({ patterns }) {
              void patterns;
              throw new Error("cannot import into a tuple");
            },
            Record({ elements }) {
              for (const element of elements.value) {
                match(element.value, {
                  Identifier({ name }) {
                    definitions.push({
                      name: name.value,
                      value: {
                        kind: "Call",
                        callee: importValue,
                        parameter: {
                          kind: "String",
                          value: name.value,
                        },
                      },
                    });
                  },
                  KeyValuePair({ name, pattern }) {
                    void [name, pattern];
                    throw new Error("not implemented");
                  },
                });
              }
            }
          });
        }
      });
    } catch (e) {
      return error(e as any);
    }
  }
  
  const result: abstract.Module = {
    definitions,
  };

  if (exports !== undefined) {
    EXPORT_MAP.set(result, exports);
  }

  return ok(result);
}

export function createLoweringCompiler(): Compiler<surface.Module, abstract.Module> {
  return new Compiler({
    run: lowerModule,
  });
}
