import { decl, expr, node, Project, stmt } from "@serendipity/editor-stores";
import type { Module } from "@serendipity/parser";

export namespace spawn {
  export function declaration(kind: string) {
    switch (kind) {
      case "Main":
        return Project.addDeclaration(decl.main());
      case "Const":
        return Project.addDeclaration(decl.const());
      case "Function":
        return Project.addDeclaration(decl.function());
      case "Import":
        return Project.addDeclaration(decl.import());
      case "Export":
        return Project.addDeclaration(decl.export());
      case "TypeAlias":
        return Project.addDeclaration(decl.typeAlias());
      case "Interface":
        return Project.addDeclaration(decl.interface());
      default:
        throw new Error(`Unknown declaration kind: ${kind}`);
    }
  }

  export function exprKind(kind: string) {
    const factories: Record<string, () => ReturnType<typeof node>> = {
      Number: () => node(expr.number()),
      String: () => node(expr.string()),
      Boolean: () => node(expr.boolean()),
      Name: () => node(expr.name()),
      None: () => node(expr.none()),
      Call: () => node(expr.call()),
      If: () => node(expr.if()),
      Procedure: () => node(expr.procedure()),
    };
    const factory = factories[kind];
    if (!factory) throw new Error(`Unknown expression kind: ${kind}`);
    return Project.addDetachedExpression(factory() as any);
  }

  export function statement(kind: string) {
    const factories = {
      Let: stmt.let,
      Set: stmt.set,
      If: stmt.if,
      ForIn: stmt.forIn,
      Forever: stmt.forever,
      Do: stmt.do,
      Break: stmt.break,
      Continue: stmt.continue,
      Pass: stmt.pass,
      Expression: stmt.expression,
    };
    const factory = factories[kind as keyof typeof factories];
    if (!factory) throw new Error(`Unknown statement kind: ${kind}`);
    return Project.addDetachedStatements([node(factory() as any)]);
  }
}

export namespace project {
  export function reset() {
    Project.reset();
  }

  export function clearStorage() {
    Project.clearStorage();
  }

  export function dump() {
    Project.dump();
  }

  export function toParserModule(): Module {
    return Project.toParserModule();
  }
}
