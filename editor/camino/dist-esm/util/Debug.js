import ProjectStore from 'stores/ProjectStore';
function hole() {
    const e = {
        exprKind: "@hole"
    };
    ProjectStore.loadGUID(e);
    return e;
}
function stmtHole() {
    const s = {
        statementKind: "@hole"
    };
    ProjectStore.loadGUID(s);
    return s;
}
function rq(v, type) {
    if (v && typeof (v) === type) {
        return v;
    }
    else {
        throw new Error("Required debug parameter did not satisfy type " + type + ": " + v.toString());
    }
}
// tslint:disable-next-line: no-namespace
export var spawn;
(function (spawn) {
    function statement(skind, ...args) {
        const s = { statementKind: skind };
        const sm = (() => {
            switch (s.statementKind) {
                case "do":
                    return {
                        statementKind: "do",
                        body: hole()
                    };
                case "break":
                    return {
                        statementKind: "break"
                    };
                case "forever":
                    return {
                        statementKind: "forever",
                        body: stmtHole()
                    };
                case "forin":
                    return {
                        statementKind: "forin",
                        binding: "",
                        value: hole(),
                        body: stmtHole()
                    };
                case "if":
                    return {
                        statementKind: "if",
                        condition: hole(),
                        body: stmtHole(),
                        _else: undefined
                    };
                case "let":
                    return {
                        statementKind: "let",
                        name: "",
                        value: hole()
                    };
                case "set":
                    return {
                        statementKind: "set",
                        name: "",
                        value: hole()
                    };
                case "print":
                    return {
                        statementKind: "print",
                        value: hole()
                    };
                case "@hole":
                    throw new Error("Cannot instantiate a floating hole.");
                default:
                    // tslint:disable-next-line: variable-name
                    const __exhaust = s;
                    return __exhaust;
            }
        })();
        ProjectStore.addGlobal({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "statement",
            element: [sm]
        });
    }
    spawn.statement = statement;
    function global(gkind, ...args) {
        const g = { globalKind: gkind };
        const s = (() => {
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
                    };
                default:
                    // tslint:disable-next-line: variable-name
                    const __exhaust = g;
                    return __exhaust;
            }
        })();
        ProjectStore.addGlobal(s);
    }
    spawn.global = global;
    function expr(ekind, ...args) {
        const e = { exprKind: ekind };
        const s = (() => {
            switch (e.exprKind) {
                case "accessor":
                    return {
                        exprKind: "accessor",
                        accessee: hole(),
                        index: hole()
                    };
                case "arithmetic":
                    return {
                        exprKind: "arithmetic",
                        left: hole(),
                        right: hole(),
                        op: "+"
                    };
                case "number":
                    return {
                        exprKind: "number",
                        value: 0
                    };
                case "string":
                    return {
                        exprKind: "string",
                        value: ""
                    };
                case "boolean":
                    return {
                        exprKind: "boolean",
                        value: false
                    };
                case "name":
                    return {
                        exprKind: "name",
                        name: ""
                    };
                case "with":
                    return {
                        exprKind: "with",
                        binding: ["", hole()],
                        expr: hole()
                    };
                case "call":
                    return {
                        exprKind: "call",
                        parameters: [],
                        callee: hole()
                    };
                case "closure":
                    return {
                        exprKind: "closure",
                        body: hole(),
                        parameters: []
                    };
                case "list":
                    return {
                        exprKind: "list",
                        contents: []
                    };
                case "tuple":
                    return {
                        exprKind: "tuple",
                        values: []
                    };
                case "procedure":
                    return {
                        exprKind: "procedure",
                        body: [{
                                statementKind: "@hole"
                            }]
                    };
                case "void":
                    return {
                        exprKind: "void"
                    };
                case "if":
                    return {
                        exprKind: "if",
                        cond: hole(),
                        then: hole(),
                        _else: hole()
                    };
                case "compare":
                    return {
                        exprKind: "compare",
                        left: hole(),
                        right: hole(),
                        op: rq(args[0], "string")
                    };
                case "@hole":
                    throw new Error("Cannot instantiate a floating hole.");
                default:
                    // tslint:disable-next-line: variable-name
                    const __exhaust = e;
                    return __exhaust;
            }
        })();
        ProjectStore.addGlobal({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: s
        });
    }
    spawn.expr = expr;
})(spawn || (spawn = {}));
// tslint:disable-next-line: no-namespace
export var project;
(function (project) {
    function reset() {
        ProjectStore.reset();
    }
    project.reset = reset;
})(project || (project = {}));
