// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/// <reference lib="es6" />

import { Module, BinaryOperator, BinaryOp, Expression } from "@serendipity/syntax-abstract";

import { match } from "omnimatch";

import { Value, NumberV, IntrinsicV } from "./value";
import { Scope } from "./scope";

function _isTotalType(v: Value): boolean {
  switch (v.kind) {
    case "void":
    case "number":
    case "string":
    case "boolean":
      return true;
    default:
      return false;
  }
}

function isTrue(v: Value): boolean {
  switch (v.kind) {
    case "number":
      return v.value !== 0;
    case "string":
      return v.value !== "";
    case "boolean":
      return v.value;
    default:
      throw new Error("Value is not convertible to Boolean: " + v.kind);
  }
}

function arithOp(l: NumberV, r: NumberV, op: BinaryOperator): Value {
  const lv = l.value;
  const rv = r.value;
  switch (op) {
    case "*":
      return { kind: "number", value: lv * rv };
    case "/":
      return { kind: "number", value: lv / rv };
    case "-":
      return { kind: "number", value: lv - rv };
    case "+":
      return { kind: "number", value: lv + rv };
    case "%":
      return { kind: "number", value: lv % rv };
    default:
      throw new Error("Encountered unimplemented arithmetic operator " + op);
  }
}

function compareOp(lv: Value, rv: Value, op: BinaryOperator): Value {
  return {
    kind: "boolean",
    value: (() => {
      if (lv.kind !== rv.kind) {
        return false;
      }

      let negate = false;
      let result;
      switch (op) {
        case "!=":
          negate = true;
        // eslint-disable-next-line no-fallthrough
        case "==":
          if (_isTotalType(lv)) {
            if (lv.kind === "void" || rv.kind === "void") {
              // Voids are always equal
              result = true;
            } else if (lv.kind === "intrinsic" || rv.kind === "intrinsic") {
              result = lv === rv;
            } else {
              result = lv.value === rv.value;
            }
          } else {
            result = lv === rv;
          }
          return negate ? !result : result;
        case ">":
          negate = true;
        // eslint-disable-next-line no-fallthrough
        case "<=":
          if (_isTotalType(lv)) {
            if (lv.kind === "void") {
              // Voids are always equal
              result = true;
            } else if (
              (lv.kind === "string" || lv.kind === "number") &&
              (rv.kind === "string" || rv.kind === "number")
            ) {
              result = lv.value <= rv.value;
            } else {
              throw new Error("Cannot compare booleans.");
            }
          } else {
            throw new Error("Cannot compare incomplete values.");
          }
          return negate ? !result : result;
        case "<":
          negate = true;
        // eslint-disable-next-line no-fallthrough
        case ">=":
          if (_isTotalType(lv)) {
            if (lv.kind === "void") {
              // Voids are always equal
              result = true;
            } else if (lv.kind === "intrinsic") {
              return false;
            } else if (
              (lv.kind === "string" || lv.kind === "number") &&
              (rv.kind === "string" || rv.kind === "number")
            ) {
              result = lv.value >= rv.value;
            } else {
              throw new Error("Cannot compare booleans.");
            }
          } else {
            throw new Error("Cannot compare incomplete values.");
          }
          return negate ? !result : result;
        default:
          throw new Error("Unimplemented comparison operator " + op);
      }
    })(),
  };
}

type Printer = (s: string) => void;
type Prompter = (s?: string) => string;

export interface InterpreterOptions {
  printer: Printer;
  prompt: Prompter;
  beforeEval: (expr: Expression, scope: Scope) => void;
}

const defaultOptions: InterpreterOptions = {
  printer() {
    throw new Error("No print function provided to interpreter");
  },
  prompt() {
    throw new Error("No prompt function provided to interpeter");
  },
  beforeEval: () => {
    /* empty */
  },
};

export class Interpreter {
  private options: InterpreterOptions;

  public constructor(options: Partial<InterpreterOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  public execModule(m: Module): void {
    const scope: Scope = new Scope(this.evalExpr.bind(this));

    let main = false;
    for (const { name: _name, value } of m.definitions) {
      if (_name === "__start") {
        main = true;
      }
      scope.scope(_name, value);
    }

    if (main) {
      this.evalExpr(
        {
          kind: "Name",
          name: "__start",
        },
        scope
      );
    }
  }

  // TODO: remove this in favor of a core module and think hard about what
  // should be in core
  private getIntrinsic(scope: Scope, _name: string): IntrinsicV {
    switch (_name.split(".")[1]) {
      case "print_stmt":
        return {
          kind: "intrinsic",
          fn: (param?: Value): Value => {
            if (!param) {
              throw new Error("Called print_stmt intrinsic with no parameter.");
            }

            this.options.printer(this._strconv(param));

            return {
              kind: "closure",
              value: {
                body: scope.bind({
                  kind: "Name",
                  name: "__ident",
                }),
                parameter: "__ident",
              },
            };
          },
        };
      case "read_line":
        return {
          kind: "intrinsic",
          fn: (param?: Value): Value => {
            if (param && param.kind !== "string") {
              throw new Error("readline: prompt must be a string!");
            }

            let result: string;
            if (param && param.kind === "string") {
              result = this.options.prompt(param.value);
            } else {
              result = this.options.prompt();
            }

            return {
              kind: "string",
              value: result,
            };
          },
        };
      case "str_split":
        return {
          kind: "intrinsic",
          fn: (str?: Value): Value => {
            if (!str || str.kind !== "string") {
              throw new Error("str_split: no string provided");
            }

            return {
              kind: "intrinsic",
              fn: (splitOn?: Value): Value => {
                if (!splitOn || (splitOn.kind !== "string" && splitOn.kind !== "number")) {
                  throw new Error("str_split: no splitOn provided (must be string or number)");
                }

                let leftStr: string;
                let rightStr: string;
                if (splitOn.kind === "string") {
                  const split = str.value.split(splitOn.value, 2);
                  if (split.length !== 2) {
                    throw new Error("str_split: split delimiter not found");
                  }
                  [leftStr, rightStr] = split as [string, string];
                } else {
                  if (splitOn.value > str.value.length) {
                    throw new Error("str_split: index out of bounds");
                  }
                  [leftStr, rightStr] = [
                    str.value.substring(0, splitOn.value),
                    str.value.substring(splitOn.value, str.value.length),
                  ];
                }

                const emptyScope = new Scope(this.evalExpr.bind(this));

                return {
                  kind: "tuple",
                  value: [
                    {
                      expr: {
                        kind: "String",
                        value: leftStr,
                      },
                      scope: emptyScope,
                    },
                    {
                      expr: {
                        kind: "String",
                        value: rightStr,
                      },
                      scope: emptyScope,
                    },
                  ],
                };
              },
            };
          },
        };
      case "str_cat":
        return {
          kind: "intrinsic",
          fn: (rightStr?: Value): Value => {
            if (!rightStr || rightStr.kind !== "string") {
              throw new Error("str_join: no leftStr provided");
            }

            return {
              kind: "intrinsic",
              fn: (leftStr?: Value): Value => {
                if (!leftStr || leftStr.kind !== "string") {
                  throw new Error("str_join: no rightStr provided");
                }

                return {
                  kind: "string",
                  value: leftStr.value + rightStr.value,
                };
              },
            };
          },
        };
      default:
        throw new Error("Unimplemented intrinsic " + _name);
    }
  }

  private _strconv(v: Value): string {
    switch (v.kind) {
      case "number":
        return v.value.toString();
      case "string":
        return v.value;
      case "boolean":
        return v.value ? "true" : "false";
      case "void":
        return v.kind;
      case "tuple": {
        const vals = v.value.map((bind) => this.evalExpr(bind.expr, bind.scope));
        return "(" + vals.map(this._strconv.bind(this)).join(", ") + ")";
      }
      default: {
        const attrs: string[] = [];
        for (const k of Object.keys(v)) {
          if (Object.prototype.hasOwnProperty.call(v, k)) {
            attrs.push(k + "=(" + v[k as keyof Value].toString() + ")");
          }
        }

        return "#" + v.kind + "{" + attrs.join(", ") + "}";
      }
    }
  }

  private binaryOperator({ op, left, right }: BinaryOp, scope: Scope): Value {
    const lv = this.evalExpr(left, scope);
    const rv = this.evalExpr(right, scope);
    switch (op) {
      case BinaryOperator.ADD:
      case BinaryOperator.SUB:
      case BinaryOperator.MUL:
      case BinaryOperator.DIV:
      case BinaryOperator.MOD:
        if (lv.kind !== "number" || rv.kind !== "number") {
          throw new Error("Attempted to do arithmetic on non-numbers");
        } else {
          return arithOp(lv, rv, op);
        }

      default:
        return compareOp(lv, rv, op);
    }
  }

  private evalExpr(e: Expression, scope: Scope): Value {
    this.options.beforeEval(e, scope);
    return match(e, {
      Number: ({ value }): Value => ({ kind: "number", value }),
      String: ({ value }): Value => ({ kind: "string", value }),
      Boolean: ({ value }): Value => ({ kind: "boolean", value }),
      Name: ({ name: _name }): Value => {
        if (_name.startsWith("__core")) {
          return this.getIntrinsic(scope, _name);
        }
        const res = scope.resolve(_name);
        if (!res) {
          throw new Error("name not found: " + _name);
        }

        return res;
      },
      Accessor: ({ accessee, index }): Value => {
        const aVal = this.evalExpr(accessee, scope);

        if (aVal.kind !== "tuple") {
          throw new Error("Tried to access index on a non-tuple");
        }

        const iVal = this.evalExpr(index, scope);

        if (iVal.kind !== "number") {
          throw new Error("Tried to index an object with something that isn't a number");
        }

        if (iVal.value >= aVal.value.length) {
          throw new Error("Index out of bounds");
        }

        const resExpr = aVal.value[iVal.value]!;
        return this.evalExpr(resExpr.expr, resExpr.scope);
      },
      Call: ({ callee, parameter }): Value => {
        const calleeValue = this.evalExpr(callee, scope);

        if (calleeValue.kind === "intrinsic") {
          // Handle intrinsics specially for now
          return calleeValue.fn(parameter ? this.evalExpr(parameter, scope) : undefined);
        }

        if (calleeValue.kind !== "closure") {
          throw new Error("Attempted to call a non-function");
        }

        const evalScope = new Scope(this.evalExpr.bind(this), calleeValue.value.body.scope);

        if (parameter !== undefined) {
          if (calleeValue.value.parameter === undefined) {
            throw new Error("Callee does not accept a parameter, but one was given.");
          }
          if (calleeValue.value.parameter !== "" && calleeValue.value.parameter !== "_") {
            evalScope.rebind(calleeValue.value.parameter, scope.bind(parameter));
          }
        }

        return this.evalExpr(calleeValue.value.body.expr, evalScope);
      },
      Closure: ({ body, parameter }): Value => ({
        kind: "closure",
        value: {
          body: scope.bind(body),
          parameter,
        },
      }),
      Tuple: ({ values }): Value => {
        const vals = values.map((exprBind) => scope.bind(exprBind));
        return {
          kind: "tuple",
          value: vals,
        };
      },
      If: ({ cond, then, _else }): Value => {
        if (isTrue(this.evalExpr(cond, scope))) {
          return this.evalExpr(then, scope);
        } else {
          return this.evalExpr(_else, scope);
        }
      },
      BinaryOp: (v) => this.binaryOperator(v, scope),
      Void: (): Value => ({ kind: "void" }),
    });
  }
}
