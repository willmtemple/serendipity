import { Expression } from "../../lib/lang/syntax/surface/expression";
import { Value } from "./value";
import { evalExpr } from "./eval";

export type Binder = {
    expr: Expression,
    scope: Scope
}

export interface CachedExpression {
    kind: "expression",
    expr: Expression,
    cache?: Value,
}

export interface CachedBinder {
    kind: "binder",
    bind: Binder,
    cache?: Value,
}

export type ScopedObject = CachedExpression | CachedBinder;

export class Scope {
    parent?: Scope;
    bindings: { [k: string]: ScopedObject };

    constructor(parent?: Scope) {
        this.parent = parent;
        this.bindings = {};
    }

    scope(name: string, expr: Expression) {
        this.bindings[name] = { kind: "expression", expr };
    }

    rebind(name: string, bind: Binder) {
        this.bindings[name] = { kind: "binder", bind };
    }

    bind(expr: Expression): Binder {
        const scope = new Scope(this);
        return {
            expr,
            scope,
        }
    }

    resolve(name: string): Value {
        const bound = this.bindings[name];

        if (bound) {
            return this.eval(bound);
        } else if (this.parent) {
            return this.parent.resolve(name)
        } else {
            throw new Error("No such binding for name: " + name);
        }
    }

    private eval(cexpr: ScopedObject): Value {
        if (cexpr.cache) {
            return cexpr.cache;
        } else {
            let res;
            switch (cexpr.kind) {
                case "expression":
                    res = evalExpr(cexpr.expr, this);
                    delete cexpr.expr;
                    break;
                case "binder":
                    res = evalExpr(cexpr.bind.expr, cexpr.bind.scope);
                    delete cexpr.bind;
                    break;
                default:
                    const __exhaust: never = cexpr;
                    return __exhaust;
            }
            cexpr.cache = res;
            return res;
        }
    }
}