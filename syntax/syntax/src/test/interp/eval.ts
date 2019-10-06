// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Value, NumberV } from "./value";
import {
  Expression,
  matchExpression,
  BinaryOp,
  BinaryOperator
} from "../../lib/lang/syntax/abstract/expression";
import { Scope } from "./scope";
import { Statement, matchStatement } from "../../lib/lang/syntax/abstract/statement";
import { Module } from "../../lib/lang/syntax/abstract";
import { matchGlobal, Main } from "../../lib/lang/syntax/abstract/global";

import * as console from "console";

enum StatementStatus {
  NORMAL = 0,
  BREAK
}

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
        throw new Error("Incompatible types in comparison.");
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
            } else if (lv.kind === "proc" || rv.kind === "proc") {
              // Procs are never equal
              result = false;
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
            } else if (lv.kind === "proc") {
              return false;
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
            } else if (lv.kind === "proc") {
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

export class Interpreter {
  // eslint-disable-next-line no-console
  private _print: Printer = console.log.bind(console);

  public constructor(printer?: Printer) {
    if (printer) {
      this._print = printer;
    }
  }

  public execModule(m: Module): void {
    const scope: Scope = new Scope(this.evalExpr.bind(this));
    let main: Main;
    m.globals.forEach(
      matchGlobal<void>({
        Main: (_main) => {
          main = _main;
        },
        Define: ({ name, value }) => {
          scope.scope(name, value);
        },
        Default: (g) => {
          throw new Error("not imlemented: " + g.globalKind);
        }
      })
    );

    if (main) {
      const bV = this.evalExpr(main.body, scope);

      if (bV.kind !== "proc") {
        throw new Error("main declaration must be a procedure");
      }

      const evalScope = new Scope(this.evalExpr.bind(this), bV.scope);
      for (const stmt of bV.body) {
        if (this.execStmt(stmt, evalScope) === StatementStatus.BREAK) {
          throw new Error("Encountered `break` in non-breakable context: MAIN");
        }
      }
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
    if (lv.kind !== rv.kind) {
      throw new Error("Type mismatch in binary operation");
    } else {
      switch (op) {
        case BinaryOperator.ADD:
        case BinaryOperator.SUB:
        case BinaryOperator.MUL:
        case BinaryOperator.DIV:
        case BinaryOperator.MOD:
          if (lv.kind !== "number") {
            throw new Error("Attempted to do arithmetic on non-numbers");
          } else {
            return arithOp(lv, rv as NumberV, op);
          }

        default:
          return compareOp(lv, rv, op);
      }
    }
  }

  private evalExpr(e: Expression, scope: Scope): Value {
    return matchExpression<Value>({
      Number: ({ value }) => ({ kind: "number", value }),
      String: ({ value }) => ({ kind: "string", value }),
      Name: ({ name }) => {
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
      Procedure: ({ body }) => ({
        kind: "proc",
        body,
        scope: new Scope(this.evalExpr.bind(this), scope)
      }),
      If: ({ cond, then, _else }) => {
        if (isTrue(this.evalExpr(cond, scope))) {
          return this.evalExpr(then, scope);
        } else {
          return this.evalExpr(_else, scope);
        }
      },
      BinaryOp: (v) => this.binaryOperator(v, scope),
      Void: (_) => ({ kind: "void" }),
      Default: (_) => {
        throw new Error("not implemented");
      }
    })(e);
  }

  private execStmt(s: Statement, scope: Scope): StatementStatus {
    return matchStatement({
      Print: (p) => {
        this._print(
          this._strconv(this.evalExpr(p.value, new Scope(this.evalExpr.bind(this), scope)))
        );
        return StatementStatus.NORMAL;
      },
      Let: ({ name, value }) => {
        scope.scope(name, value);
        return StatementStatus.NORMAL;
      },
      If: ({ condition, body, _else }) => {
        const value = this.evalExpr(condition, scope);

        if (isTrue(value)) {
          return this.execStmt(body, scope);
        } else if (_else) {
          return this.execStmt(_else, scope);
        }

        return StatementStatus.NORMAL;
      },
      ForIn: ({ binding, value, body }) => {
        for (
          let iter = this.evalExpr(value, scope);
          iter.kind !== "void";
          iter = this.evalExpr(iter.value[1].expr, iter.value[1].scope)
        ) {
          if (iter.kind !== "tuple" || iter.value.length !== 2) {
            throw new Error("only lists (tuples of dimension 2) are iterable using for ... in");
          }

          const evalScope = new Scope(this.evalExpr.bind(this), scope);
          evalScope.rebind(binding, iter.value[0]);
          if (this.execStmt(body, evalScope) === StatementStatus.BREAK) {
            break;
          }
        }
        return StatementStatus.NORMAL;
      },
      Forever: ({ body }) => {
        let shouldContinue = true;
        while (shouldContinue) {
          if (
            this.execStmt(body, new Scope(this.evalExpr.bind(this), scope)) ===
            StatementStatus.BREAK
          ) {
            shouldContinue = false;
          }
        }

        return StatementStatus.NORMAL;
      },
      Do: ({ body }) => {
        const bV = this.evalExpr(body, scope);
        if (bV.kind !== "proc") {
          throw new Error("cannot 'do' anything other than a Procedure");
        }

        const evalScope = new Scope(this.evalExpr.bind(this), bV.scope);
        for (const stmt of bV.body) {
          if (this.execStmt(stmt, evalScope) === StatementStatus.BREAK) {
            throw new Error("Encountered `break` in non-breakable context: DO");
          }
        }

        return StatementStatus.NORMAL;
      },
      Break: (_) => {
        return StatementStatus.BREAK;
      },
      Default: (_) => {
        throw new Error("not implemented");
      }
    })(s);
  }
}
