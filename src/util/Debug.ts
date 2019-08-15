import { Expression } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';

import ProjectStore from 'src/stores/ProjectStore';

function hole() : Expression {
    const e: Expression = {
        exprKind: "@hole"
    };

    ProjectStore.loadGUID(e as any);

    return e;
}

// tslint:disable-next-line: no-namespace
export namespace spawn {
    export function expr(kind : string, ...args: any[]) {
        const s: Expression = (() : Expression => {
            switch (kind) {
                case "accessor":
                    return {
                        exprKind: "accessor",
                        accessee: hole(),
                        index: hole()
                    }
                case "arithmetic":
                    return {
                        exprKind: "arithmetic",
                        left: hole(),
                        right: hole(),
                        op: "+"
                    }
                case "number":
                    return {
                        exprKind: "number",
                        value: 0
                    }
                case "string":
                    return {
                        exprKind: "string",
                        value: ""
                    }
                case "name":
                    return {
                        exprKind: "name",
                        name: ""
                    }
                case "with":
                    return {
                        exprKind: "with",
                        binding: ["", hole()],
                        expr: hole()
                    }
                case "call":
                    return {
                        exprKind: "call",
                        parameters: [],
                        callee: hole()
                    }
                case "closure":
                    return {
                        exprKind: "closure",
                        body: hole(),
                        parameters: []
                    }
                case "list":
                    return {
                        exprKind: "list",
                        contents: []
                    }
                case "tuple":
                    return {
                        exprKind: "tuple",
                        values: []
                    }
                case "procedure":
                    return {
                        exprKind: "procedure",
                        body: [{
                            statementKind: "@hole"
                        }]
                    }
                case "void":
                    return {
                        exprKind: "void"
                    }
                case "if":
                    return {
                        exprKind: "if",
                        cond: hole(),
                        then: hole(),
                        _else: hole()
                    }
                case "compare":
                    return {
                        exprKind: "compare",
                        left: hole(),
                        right: hole(),
                        op: "=="
                    }
                default:
                    throw new Error("Cannot instantiate expression: " + kind);
            }
        })();

        ProjectStore.addExpr(s);
    }
}

// tslint:disable-next-line: no-namespace
export namespace project {
    export function reset() {
        ProjectStore.reset();
    }
}