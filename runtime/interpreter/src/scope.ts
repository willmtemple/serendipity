// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Expression } from "@serendipity/syntax-abstract";
import { Value } from "./value";

export type Binder = {
  expr: Expression;
  scope: Scope;
};

export interface CachedExpression {
  kind: "expression";
  expr: Expression;
  cache?: Value;
}

export interface CachedBinder {
  kind: "binder";
  bind: Binder;
  cache?: Value;
  expr?: undefined;
}

export interface ScopedValue {
  kind: "value";
  value: Value;
}

export type ScopedObject = CachedExpression | CachedBinder | ScopedValue;

type Evaluator = (e: Expression, s: Scope) => Value;

export class Scope {
  private evaluator: Evaluator;
  private parent?: Scope;
  private bindings: { [k: string]: ScopedObject };

  public constructor(evaluator: Evaluator, parent?: Scope) {
    this.evaluator = evaluator;
    this.parent = parent;
    this.bindings = {};
  }

  public scope(name: string, expr: Expression): void {
    this.bindings[name] = { kind: "expression", expr };
  }

  public rebind(name: string, bind: Binder): void {
    this.bindings[name] = { kind: "binder", bind };
  }

  public bind(expr: Expression): Binder {
    const scope = new Scope(this.evaluator, this);
    return {
      expr,
      scope
    };
  }

  public demandInScope(name: string, expr: Expression): void {
    this.set(name, { kind: "value", value: this.evaluator(expr, this) });
  }

  public resolve(name: string): Value {
    const bound = this.bindings[name];

    if (bound) {
      return this.eval(bound);
    } else if (this.parent) {
      return this.parent.resolve(name);
    } else {
      throw new Error("No such binding for name: " + name);
    }
  }

  private set(name: string, cexpr: ScopedObject): void {
    if (this.bindings[name]) {
      this.bindings[name] = cexpr;
    } else if (this.parent) {
      this.parent.set(name, cexpr);
    } else {
      throw new Error("No such binding for name: " + name);
    }
  }

  private eval(cexpr: ScopedObject): Value {
    if (cexpr.kind === "value") {
      return cexpr.value;
    }

    if (cexpr.cache) {
      return cexpr.cache;
    } else {
      let res;
      switch (cexpr.kind) {
        case "expression":
          res = this.evaluator(cexpr.expr, this);
          delete (cexpr as any).expr;
          break;
        case "binder":
          res = this.evaluator(cexpr.bind.expr, cexpr.bind.scope);
          delete (cexpr as any).bind;
          break;
        default: {
          const __exhaust: never = cexpr;
          return __exhaust;
        }
      }
      cexpr.cache = res;
      return res;
    }
  }
}
