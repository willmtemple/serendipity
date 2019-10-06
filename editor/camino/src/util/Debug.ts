import { Expression } from '@serendipity/syntax/dist/lib/lang/syntax/surface/expression';
import { Global } from '@serendipity/syntax/dist/lib/lang/syntax/surface/global';
import { Statement } from '@serendipity/syntax/dist/lib/lang/syntax/surface/statement';

import ProjectStore from 'stores/ProjectStore';

function hole() : Expression {
    const e: Expression = {
        exprKind: "@hole"
    };

    ProjectStore.loadGUID(e as any);

    return e;
}

function stmtHole() : Statement {
    const s : Statement = {
        statementKind: "@hole"
    };

    ProjectStore.loadGUID(s as any);

    return s;
}

function rq<T>(v : any, type : string) : T {
    if (v && typeof(v) === type) {
        return v as T;
    } else {
        throw new Error("Required debug parameter did not satisfy type " + type + ": " + v.toString());
    }
}

// tslint:disable-next-line: no-namespace
export namespace spawn {
    export function statement(skind: string, ...args: any[]) {
        const s = { statementKind : skind } as Statement;
        const sm : Statement = (() : Statement => {
            switch (s.statementKind) {
                case "do":
                    return {
                        statementKind: "do",
                        body: hole()
                    }
                case "break":
                    return {
                        statementKind: "break"
                    }
                case "forever":
                    return {
                        statementKind: "forever",
                        body: stmtHole()
                    }
                case "forin":
                    return {
                        statementKind: "forin",
                        binding: "",
                        value: hole(),
                        body: stmtHole()
                    }
                case "if":
                    return {
                        statementKind: "if",
                        condition: hole(),
                        body: stmtHole(),
                        _else: undefined
                    }
                case "let":
                    return {
                        statementKind: "let",
                        name: "",
                        value: hole()
                    }
                case "print":
                    return {
                        statementKind: "print",
                        value: hole()
                    }
                case "@hole":
                    throw new Error("Cannot instantiate a floating hole.");
                default:
                    // tslint:disable-next-line: variable-name
                    const __exhaust : never = s;
                    return __exhaust;
            }
        })();

        ProjectStore.addGlobal({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "statement",
            element: [sm]
        });
    }

    export function global(gkind: string, ...args: any[]) {
        const g = { globalKind : gkind } as Global;
        const s: Global = (() : Global => {
            switch (g.globalKind) {
                case "define":
                    return {
                        globalKind: "define",
                        name: "",
                        value: hole()
                    };
                case "definefunc":
                    return {
                        globalKind: "definefunc",
                        name: "",
                        body: hole(),
                        parameters: []
                    };
                case "main":
                    return {
                        globalKind: "main",
                        body: hole()
                    }
                default:
                    // tslint:disable-next-line: variable-name
                    const __exhaust : never = g;
                    return __exhaust;
            }
        })();

        ProjectStore.addGlobal(s);
    }

    export function expr(ekind : string, ...args: any[]) {
        const e = { exprKind : ekind } as Expression;
        const s: Expression = (() : Expression => {
            switch (e.exprKind) {
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
                        op: rq(args[0], "string")
                    }
                case "@hole":
                    throw new Error("Cannot instantiate a floating hole.");
                default:
                    // tslint:disable-next-line: variable-name
                    const __exhaust : never = e;
                    return __exhaust;
            }
        })();

        ProjectStore.addGlobal({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: s
        });
    }
}

// tslint:disable-next-line: no-namespace
export namespace project {
    export function reset() {
        ProjectStore.reset();
    }
}