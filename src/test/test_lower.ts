import { surfaceExample } from "./examples";
import { Compiler, CompilerOutput } from "../lib/compiler";
import { SurfaceModule } from "../lib/lang/syntax/surface";
import { ok, unwrap } from "../lib/util/Result";
import { matchGlobal, Global } from "../lib/lang/syntax/surface/global";
import { Expression, matchExpression } from "../lib/lang/syntax/surface/expression";
import { matchStatement, Statement } from "../lib/lang/syntax/surface/statement";
import { execModule } from "./surface_interp/eval";

function _curry(parameters: string[], body: Expression): Expression {
    let val: Expression;

    if (parameters.length === 0) {
        // No parameter for this closure
        val = {
            exprKind: "closure",
            parameters: [],
            body: lowerExpr(body),
        }
    } else {
        // Curry the paramters into separate closures.
        for (let p of parameters) {
            val = {
                exprKind: "closure",
                parameters: [p],
                // Stack the closures
                body: val || lowerExpr(body),
            }
        }
    }

    return val;
}

function lowerStatement(s: Statement): Statement {
    return matchStatement<Statement>({
        Print: ({ value }) => ({
            statementKind: "print",
            value: lowerExpr(value),
        }),
        Let: ({ name, value }) => ({
            statementKind: "let",
            name,
            value: lowerExpr(value),
        }),
        If: ({ condition, body, _else }) => ({
            statementKind: "if",
            condition: lowerExpr(condition),
            body: lowerStatement(body),
            _else: _else && lowerStatement(_else),
        }),
        ForIn: ({ binding, value, body }) => ({
            statementKind: "forin",
            binding,
            value: lowerExpr(value),
            body: lowerStatement(body)
        }),
        Forever: ({ body }) => ({
            statementKind: "forever",
            body: lowerStatement(body),
        }),
        Do: ({ body }) => ({
            statementKind: "do",
            body: lowerExpr(body)
        }),
        Break: (s) => s,
        Default: (_) => { throw new Error("not implemented"); }
    })(s);
}

function lowerExpr(e: Expression): Expression {
    return matchExpression<Expression>({
        Number: (e) => e,
        String: (e) => e,
        Name: (e) => e,
        Accessor: ({accessee, index}) => ({
            exprKind: "accessor",
            accessee: lowerExpr(accessee),
            index: lowerExpr(index),
        }),
        Arithmetic: ({ op, left, right }) => ({
            exprKind: "arithmetic",
            op,
            left: lowerExpr(left),
            right: lowerExpr(right)
        }),
        With: ({ binding, expr }) => {
            // Just transform this into an in-place call.
            return {
                exprKind: "call",
                callee: {
                    exprKind: "closure",
                    parameters: [binding[0]],
                    body: lowerExpr(expr),
                },
                parameters: [lowerExpr(binding[1])]
            }
        },
        Call: ({ callee, parameters }) => {
            const calleeLowered = lowerExpr(callee);
            if (parameters.length === 0) {
                return {
                    exprKind: "call",
                    callee: calleeLowered,
                    parameters: []
                };
            } else {
                let call : Expression;
                for (let i = parameters.length - 1; i >= 0; i--) {
                    call = {
                        exprKind: "call",
                        callee: call || calleeLowered,
                        parameters: [lowerExpr(parameters[i])]
                    }
                }
                return call;
            }
        },
        Closure: ({ parameters, body }) => _curry(parameters, body),
        List: ({ contents }) => {
            let list: Expression = {
                exprKind: "void"
            }

            for (let i = contents.length - 1; i >= 0; i--) {
                list = {
                    exprKind: "tuple",
                    values: [
                        lowerExpr(contents[i]),
                        list
                    ]
                };
            }

            return list;
        },
        Tuple: ({ values }) => ({ exprKind: "tuple", values: values.map(lowerExpr) }),
        Procedure: ({ body }) => ({ exprKind: "procedure", body: body.map(lowerStatement) }),
        If: ({ cond, then, _else }) => ({
            exprKind: "if",
            cond: lowerExpr(cond),
            then: lowerExpr(then),
            _else: lowerExpr(_else)
        }),
        Compare: ({ op, left, right }) => ({
            exprKind: "compare",
            op,
            left: lowerExpr(left),
            right: lowerExpr(right),
        }),
        Void: (e) => e,
        Default: (_) => {
            throw new Error("not implemented");
        }
    })(e);
}

function lowerGlobal(g: Global): Global {
    return matchGlobal<Global>({
        Main: ({ body }) => ({
            globalKind: "main",
            body: lowerExpr(body)
        }),
        Define: ({ name, value }) => ({
            globalKind: "define",
            name,
            value: lowerExpr(value)
        }),
        DefineFunction: ({ name, parameters, body }) => {

            return {
                globalKind: "define",
                name,
                value: _curry(parameters, body),
            }
        },
    })(g);
}

function lower(i: SurfaceModule): CompilerOutput<SurfaceModule> {
    return ok({
        globals: i.globals.map(lowerGlobal),
    });
}

const compiler = new Compiler({
    run: lower
});

const res = compiler.compile(surfaceExample);

execModule(unwrap(res));