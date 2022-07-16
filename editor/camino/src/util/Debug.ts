import { Expression } from "@serendipity/syntax-surface";
import { Global } from "@serendipity/syntax-surface";
import { Statement } from "@serendipity/syntax-surface";

import { Project } from "@serendipity/editor-stores";

function hole(): Expression {
  const e: Expression = {
    kind: "@hole",
  };

  Project.loadGUID(e as any);

  return e;
}

function stmtHole(): Statement {
  const s: Statement = {
    kind: "@hole",
  };

  Project.loadGUID(s as any);

  return s;
}

function rq<T>(v: any, type: string): T {
  if (v && typeof v === type) {
    return v as T;
  } else {
    throw new Error("Required debug parameter did not satisfy type " + type + ": " + v.toString());
  }
}

// tslint:disable-next-line: no-namespace
export namespace spawn {
  export function statement(skind: string, ..._args: unknown[]) {
    const s = { kind: skind } as Statement;
    const sm: Statement = ((): Statement => {
      switch (s.kind) {
        case "Do":
          return {
            kind: "Do",
            body: hole(),
          };
        case "Break":
          return {
            kind: "Break",
          };
        case "Forever":
          return {
            kind: "Forever",
            body: stmtHole(),
          };
        case "ForIn":
          return {
            kind: "ForIn",
            binding: "",
            value: hole(),
            body: stmtHole(),
          };
        case "If":
          return {
            kind: "If",
            condition: hole(),
            body: stmtHole(),
            _else: undefined,
          };
        case "Let":
          return {
            kind: "Let",
            name: "",
            value: hole(),
          };
        case "Set":
          return {
            kind: "Set",
            name: "",
            value: hole(),
          };
        case "Print":
          return {
            kind: "Print",
            value: hole(),
          };
        case "@hole":
          throw new Error("Cannot instantiate a floating hole.");
        default:
          // tslint:disable-next-line: variable-name
          const __exhaust: never = s;
          return __exhaust;
      }
    })();

    Project.addGlobal({
      kind: "_editor_detachedsyntax",
      syntaxKind: "statement",
      element: [sm],
    });
  }

  export function global(gkind: string, ..._args: unknown[]) {
    const g = { kind: gkind } as Global;
    const s: Global = ((): Global => {
      switch (g.kind) {
        case "Define":
          return {
            kind: "Define",
            name: "",
            value: hole(),
          };
        case "DefineFunction":
          return {
            kind: "DefineFunction",
            name: "",
            body: hole(),
            parameters: [],
          };
        case "Main":
          return {
            kind: "Main",
            body: hole(),
          };
        default:
          // tslint:disable-next-line: variable-name
          const __exhaust: never = g;
          return __exhaust;
      }
    })();

    Project.addGlobal(s);
  }

  export function expr(ekind: string, ...args: unknown[]) {
    const e = { kind: ekind } as Expression;
    const s: Expression = ((): Expression => {
      switch (e.kind) {
        case "Accessor":
          return {
            kind: "Accessor",
            accessee: hole(),
            index: hole(),
          };
        case "Arithmetic":
          return {
            kind: "Arithmetic",
            left: hole(),
            right: hole(),
            op: "+",
          };
        case "Number":
          return {
            kind: "Number",
            value: 0,
          };
        case "String":
          return {
            kind: "String",
            value: "",
          };
        case "Boolean":
          return {
            kind: "Boolean",
            value: false,
          };
        case "Name":
          return {
            kind: "Name",
            name: "",
          };
        case "With":
          return {
            kind: "With",
            binding: ["", hole()],
            expr: hole(),
          };
        case "Call":
          return {
            kind: "Call",
            parameters: [],
            callee: hole(),
          };
        case "Closure":
          return {
            kind: "Closure",
            body: hole(),
            parameters: [],
          };
        case "List":
          return {
            kind: "List",
            contents: [],
          };
        case "Tuple":
          return {
            kind: "Tuple",
            values: [],
          };
        case "Procedure":
          return {
            kind: "Procedure",
            body: [
              {
                kind: "@hole",
              },
            ],
          };
        case "Void":
          return {
            kind: "Void",
          };
        case "If":
          return {
            kind: "If",
            cond: hole(),
            then: hole(),
            _else: hole(),
          };
        case "Compare":
          return {
            kind: "Compare",
            left: hole(),
            right: hole(),
            op: rq(args[0], "string"),
          };
        case "Record":
          return {
            kind: "Record",
            data: {},
          };
        case "@hole":
          throw new Error("Cannot instantiate a floating hole.");
        default:
          // tslint:disable-next-line: variable-name
          const __exhaust: never = e;
          return __exhaust;
      }
    })();

    Project.addGlobal({
      kind: "_editor_detachedsyntax",
      syntaxKind: "expression",
      element: s,
    });
  }
}

// tslint:disable-next-line: no-namespace
export namespace project {
  export function reset() {
    Project.reset();
  }
}
