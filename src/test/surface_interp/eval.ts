import { Value } from "./value";
import { Expression, matchExpression } from "../../lib/lang/syntax/surface/expression";
import { Scope } from "./scope";
import { Statement, matchStatement } from "../../lib/lang/syntax/surface/statement";
import { SurfaceModule } from "../../lib/lang/syntax/surface";
import { matchGlobal } from "../../lib/lang/syntax/surface/global";

enum StatementStatus {
    NORMAL = 0,
    BREAK,
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

function _printer(v: Value): string {
    switch (v.kind) {
        case "number":
            return v.value.toString();
        case "string":
            return v.value;
        case "boolean":
            return v.value ? "true" : "false";
        case "void":
            return v.kind;
        case "tuple":
            const vals = v.value.map((bind) => evalExpr(bind.expr, bind.scope));
            return "(" + vals.map(_printer) + ")";
        default:
            const attrs : string[] = [];
            for (let k of Object.keys(v)) {
                if (v.hasOwnProperty(k)) {
                    attrs.push(k + "=(" + (v as any)[k].toString() + ")")
                }
            }
            return "#" + v.kind + "{" + attrs.join(", ") + "}";
    }
}

export function evalExpr(e: Expression, scope: Scope): Value {
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
        Accessor: ({accessee, index}) => {
            const aVal = evalExpr(accessee, scope);

            if (aVal.kind !== "tuple") {
                throw new Error("Tried to access index on a non-tuple");
            }

            const iVal = evalExpr(index, scope);

            if (iVal.kind !== "number") {
                throw new Error("Tried to index an object with something that isn't a number")
            }

            if (iVal.value >= aVal.value.length) {
                throw new Error("Index out of bounds")
            }

            const resExpr = aVal.value[iVal.value];
            return evalExpr(resExpr.expr, resExpr.scope);
        },
        Arithmetic: ({ op, left, right }) => {
            const l = evalExpr(left, scope);
            const r = evalExpr(right, scope);
            if (!(l.kind === "number" && r.kind === "number")) {
                throw new Error("Only numbers can be used with arithmetic");
            }
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
        },
        With: ({ binding: [name, value], expr }) => {
            const evalScope = new Scope(scope);
            evalScope.scope(name, value);
            return evalExpr(expr, evalScope);
        },
        Call: ({ callee, parameters }) => {
            const calleeValue = evalExpr(callee, scope);
            if (calleeValue.kind !== "closure") {
                throw new Error("Attempted to call a non-function");
            }

            const arity = calleeValue.value.parameters.length;
            const evalScope = new Scope(calleeValue.value.body.scope);

            for (let i = 0; i < arity; i++) {
                evalScope.rebind(calleeValue.value.parameters[i], scope.bind(parameters[i]));
            }
            return evalExpr(calleeValue.value.body.expr, evalScope);
        },
        Closure: ({ body, parameters }) => ({
            kind: "closure",
            value: {
                body: scope.bind(body),
                parameters,
            }
        }),
        List: ({ contents }) => {
            if (contents.length === 0) {
                return { kind: "void" }
            } else {
                return {
                    kind: "tuple",
                    value: [
                        scope.bind(contents[0]),
                        scope.bind({
                            exprKind: "list",
                            contents: contents.slice(1),
                        })
                    ]
                }
            }
        },
        Tuple: ({ values }) => {
            const vals = values.map((e) => scope.bind(e));
            return {
                kind: "tuple",
                value: vals
            }
        },
        Procedure: ({ body }) => ({
            kind: "proc",
            body,
            scope: new Scope(scope),
        }),
        If: ({ cond, then, _else }) => {
            if (isTrue(evalExpr(cond, scope))) {
                return evalExpr(then, scope);
            } else {
                return evalExpr(_else, scope);
            }
        },
        Compare: ({ op, left, right }) => ({
            kind: "boolean",
            value: (() => {
                const lv = evalExpr(left, scope);
                const rv = evalExpr(right, scope);

                if (lv.kind !== rv.kind) {
                    throw new Error("Incompatible types in comparison.")
                }

                let negate = false;
                let result;
                switch (op) {
                    case "!=":
                        negate = true;
                    case "==":
                        if (_isTotalType(lv)) {
                            if (lv.kind === "void") {
                                // Voids are always equal
                                result = true;
                            } else {
                                result = (lv as any).value === (rv as any).value;
                            }
                        } else {
                            result = lv == rv;
                        }
                        return negate ? !result : result;
                    case ">":
                        negate = true;
                    case "<=":
                        if (_isTotalType(lv)) {
                            if (lv.kind === "void") {
                                // Voids are always equal
                                result = true;
                            } else if (lv.kind === "string" || lv.kind === "number") {
                                result = (lv as any).value <= (rv as any).value;
                            } else {
                                throw new Error("Cannot compare booleans.")
                            }
                        } else {
                            throw new Error("Cannot compare incomplete values.")
                        }
                        return negate ? !result : result;
                    case "<":
                        negate = true;
                    case ">=":
                        if (_isTotalType(lv)) {
                            if (lv.kind === "void") {
                                // Voids are always equal
                                result = true;
                            } else if (lv.kind === "string" || lv.kind === "number") {
                                result = (lv as any).value >= (rv as any).value;
                            } else {
                                throw new Error("Cannot compare booleans.")
                            }
                        } else {
                            throw new Error("Cannot compare incomplete values.")
                        }
                        return negate ? !result : result;
                }
            })()
        }),
        Void: (_) => ({ kind: "void" }),
        Default: (_) => {
            throw new Error("not implemented");
        }
    })(e);
}

function execStmt(s: Statement, scope: Scope): StatementStatus {
    return matchStatement({
        Print: (p) => {
            console.log(_printer(evalExpr(p.value, new Scope(scope))));
            return StatementStatus.NORMAL;
        },
        Let: ({ name, value }) => {
            scope.scope(name, value);
            return StatementStatus.NORMAL;
        },
        If: ({ condition, body, _else }) => {
            const value = evalExpr(condition, scope);

            if (isTrue(value)) {
                return execStmt(body, scope);
            } else if (_else) {
                return execStmt(_else, scope);
            }
            return StatementStatus.NORMAL;
        },
        ForIn: ({ binding, value, body }) => {
            for (let iter = evalExpr(value, scope); iter.kind !== "void"; iter = evalExpr(iter.value[1].expr, iter.value[1].scope)) {
                if (iter.kind !== "tuple" || iter.value.length !== 2) {
                    console.log(iter);
                    throw new Error("only lists (tuples of dimension 2) are iterable using for ... in")
                }

                const evalScope = new Scope(scope);
                evalScope.rebind(binding, iter.value[0]);
                if (execStmt(body, evalScope) === StatementStatus.BREAK) {
                    break;
                }
            }
            return StatementStatus.NORMAL;
        },
        Forever: ({ body }) => {
            while (true) {
                if (execStmt(body, new Scope(scope)) === StatementStatus.BREAK) {
                    break;
                }
            }
            return StatementStatus.NORMAL;
        },
        Do: ({ body }) => {
            const bV = evalExpr(body, scope);
            if (bV.kind !== "proc") {
                throw new Error("cannot 'do' anything other than a Procedure")
            }

            const evalScope = new Scope(bV.scope);
            for (let stmt of bV.body) {
                if (execStmt(stmt, evalScope) === StatementStatus.BREAK) {
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

export function execModule(m: SurfaceModule) {
    const scope: Scope = new Scope();
    m.globals.forEach(matchGlobal({
        Main: (m) => {
            const bV = evalExpr(m.body, scope);

            if (bV.kind !== "proc") {
                throw new Error("main declaration must be a procedure")
            }

            const evalScope = new Scope(bV.scope);
            for (let stmt of bV.body) {
                if (execStmt(stmt, evalScope) === StatementStatus.BREAK) {
                    throw new Error("Encountered `break` in non-breakable context: MAIN");
                }
            }
        },
        Define: ({ name, value }) => {
            scope.scope(name, value);
        },
        DefineFunction: ({ name, parameters, body }) => {
            scope.scope(name, {
                exprKind: "closure",
                parameters,
                body
            });
        },
        Default: (g) => {
            throw new Error("not imlemented: " + g.globalKind);
        }
    }));
}