// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Module, BinaryOperator, BinaryOp, matchExpression, Expression } from "@serendipity/syntax-abstract";

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
      throw new Error("Value is not convertible to Boolean: " + v);
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
      }
    })()
  };
}

type Printer = (s: string) => void;

export interface InterpreterOptions {
  printer: Printer,
  beforeEval: (expr: Expression, scope: Scope) => void
}

const defaultOptions: InterpreterOptions = {
  printer(_: string) {
    throw new Error("No print function provided to interpreter");
  },
  beforeEval: () => { }
}

export class Interpreter {
  private options: InterpreterOptions;

  public constructor(options: Partial<InterpreterOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  public execModule(m: Module): void {
    const scope: Scope = new Scope(this.evalExpr.bind(this));

    let main = false;
    for (const { name, value } of m.definitions) {
      if (name === "__start") {
        main = true;
      }
      scope.scope(name, value);
    }

    if (main) {
      this.evalExpr(
        {
          exprKind: "name",
          name: "__start"
        },
        scope
      );
    }
  }

  // TODO: remove this in favor of a core module and think hard about what
  // should be in core
  private getIntrinsic(scope: Scope, name: string): IntrinsicV {
    return {
      kind: "intrinsic",
      fn: (() => {
        switch (name.split(".")[1]) {
          case "print_stmt":
            return (param?: Value): Value => {
              if (!param) {
                throw new Error("Called print_stmt intrinsic with no parameter.");
              }

              this.options.printer(this._strconv(param));
              return {
                kind: "closure",
                value: {
                  body: scope.bind({
                    exprKind: "name",
                    name: "__ident"
                  }),
                  parameter: "__ident"
                }
              };
            };
          default:
            throw new Error("No such intrinsic: " + name);
        }
      })()
    };
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
        return "(" + vals.map(this._strconv.bind(this)) + ")";
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
    return matchExpression<Value>({
      Number: ({ value }) => ({ kind: "number", value }),
      String: ({ value }) => ({ kind: "string", value }),
      Boolean: ({ value }) => ({ kind: "boolean", value }),
      Name: ({ name }) => {
        if (name.startsWith("__core")) {
          return this.getIntrinsic(scope, name);
        }
        const res = scope.resolve(name);
        if (!res) {
          throw new Error("name not found: " + name);
        }

        return res;
      },
      Accessor: ({ accessee, index }) => {
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

        const resExpr = aVal.value[iVal.value];
        return this.evalExpr(resExpr.expr, resExpr.scope);
      },
      Call: ({ callee, parameter }) => {
        const calleeValue = this.evalExpr(callee, scope);

        if (calleeValue.kind === "intrinsic") {
          // Handle intrinsics specially for now
          return calleeValue.fn(this.evalExpr(parameter, scope));
        }

        if (calleeValue.kind !== "closure") {
          throw new Error("Attempted to call a non-function");
        }

        const evalScope = new Scope(this.evalExpr.bind(this), calleeValue.value.body.scope);

        if (parameter) {
          evalScope.rebind(calleeValue.value.parameter, scope.bind(parameter));
        }

        return this.evalExpr(calleeValue.value.body.expr, evalScope);
      },
      Closure: ({ body, parameter }) => ({
        kind: "closure",
        value: {
          body: scope.bind(body),
          parameter
        }
      }),
      Tuple: ({ values }) => {
        const vals = values.map((exprBind) => scope.bind(exprBind));
        return {
          kind: "tuple",
          value: vals
        };
      },
      If: ({ cond, then, _else }) => {
        if (isTrue(this.evalExpr(cond, scope))) {
          return this.evalExpr(then, scope);
        } else {
          return this.evalExpr(_else, scope);
        }
      },
      BinaryOp: (v) => this.binaryOperator(v, scope),
      Void: (_) => ({ kind: "void" })
    })(e);
  }
}
