import React from "react";

import { decl, expr, node, parameter, recordElement, stmt, useStores } from "@serendipity/editor-stores";

import type { Position } from "../../util/Position";

export type InsertContextKind = "declaration" | "expression" | "statement";

export interface InsertContext {
  kind: InsertContextKind;
  pos: Position;
  parentGuid?: string;
  key?: string;
  idx?: number;
}

interface InsertItem {
  label: string;
  kind: InsertContextKind;
  preview: string;
  make?: () => any;
  add(pos: Position): string | void;
}

interface InsertDrawerProps {
  context: InsertContext | null;
  onClose(): void;
}

export function InsertDrawer(props: InsertDrawerProps) {
  const { Project } = useStores();
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    if (props.context) setFilter("");
  }, [props.context]);

  if (!props.context) return null;

  const items: InsertItem[] = [
    { label: "main", kind: "declaration", preview: "main", add: (pos) => Project.addDeclaration(decl.main(), pos) },
    { label: "const", kind: "declaration", preview: "const name =", add: (pos) => Project.addDeclaration(decl.const(), pos) },
    { label: "function", kind: "declaration", preview: "fn name(arg) ->", add: (pos) => Project.addDeclaration(decl.function("fn", [parameter("arg")]), pos) },
    { label: "import", kind: "declaration", preview: "import name use module", add: (pos) => Project.addDeclaration(decl.import(), pos) },
    { label: "export", kind: "declaration", preview: "export ...", add: (pos) => Project.addDeclaration(decl.export(), pos) },
    { label: "type alias", kind: "declaration", preview: "type Name =", add: (pos) => Project.addDeclaration(decl.typeAlias(), pos) },
    { label: "interface", kind: "declaration", preview: "interface Name", add: (pos) => Project.addDeclaration(decl.interface(), pos) },
    { label: "number", kind: "expression", make: () => node(expr.number()), preview: "0", add: (pos) => Project.addDetachedExpression(node(expr.number()), pos) },
    { label: "string", kind: "expression", make: () => node(expr.string()), preview: "\"\"", add: (pos) => Project.addDetachedExpression(node(expr.string()), pos) },
    { label: "boolean", kind: "expression", make: () => node(expr.boolean()), preview: "true", add: (pos) => Project.addDetachedExpression(node(expr.boolean()), pos) },
    { label: "name", kind: "expression", make: () => node(expr.name()), preview: "name", add: (pos) => Project.addDetachedExpression(node(expr.name()), pos) },
    { label: "none", kind: "expression", make: () => node(expr.none()), preview: "none", add: (pos) => Project.addDetachedExpression(node(expr.none()), pos) },
    { label: "unary", kind: "expression", make: () => node(expr.unary()), preview: "- expr", add: (pos) => Project.addDetachedExpression(node(expr.unary()), pos) },
    { label: "arithmetic", kind: "expression", make: () => node(expr.arithmetic()), preview: "left + right", add: (pos) => Project.addDetachedExpression(node(expr.arithmetic()), pos) },
    { label: "compare", kind: "expression", make: () => node(expr.compare()), preview: "left == right", add: (pos) => Project.addDetachedExpression(node(expr.compare()), pos) },
    { label: "logical", kind: "expression", make: () => node(expr.logical()), preview: "left and right", add: (pos) => Project.addDetachedExpression(node(expr.logical()), pos) },
    { label: "accessor", kind: "expression", make: () => node(expr.accessor()), preview: "list[index]", add: (pos) => Project.addDetachedExpression(node(expr.accessor()), pos) },
    { label: "field access", kind: "expression", make: () => node(expr.fieldAccess()), preview: "record.field", add: (pos) => Project.addDetachedExpression(node(expr.fieldAccess()), pos) },
    { label: "function", kind: "expression", make: () => node(expr.fn([parameter("arg")])), preview: "fn(arg) ->", add: (pos) => Project.addDetachedExpression(node(expr.fn([parameter("arg")])), pos) },
    { label: "call", kind: "expression", make: () => node(expr.call()), preview: "callee()", add: (pos) => Project.addDetachedExpression(node(expr.call()), pos) },
    { label: "with", kind: "expression", make: () => node(expr.with()), preview: "with x =", add: (pos) => Project.addDetachedExpression(node(expr.with()), pos) },
    { label: "tuple", kind: "expression", make: () => node(expr.tuple()), preview: "(...)", add: (pos) => Project.addDetachedExpression(node(expr.tuple()), pos) },
    { label: "list", kind: "expression", make: () => node(expr.list()), preview: "[...]", add: (pos) => Project.addDetachedExpression(node(expr.list()), pos) },
    { label: "procedure", kind: "expression", make: () => node(expr.procedure()), preview: "do", add: (pos) => Project.addDetachedExpression(node(expr.procedure()), pos) },
    { label: "if expression", kind: "expression", make: () => node(expr.if()), preview: "if then else", add: (pos) => Project.addDetachedExpression(node(expr.if()), pos) },
    { label: "record", kind: "expression", make: () => node(expr.record([recordElement.keyValue()])), preview: "{ key: value }", add: (pos) => Project.addDetachedExpression(node(expr.record([recordElement.keyValue()])), pos) },
    { label: "let", kind: "statement", make: () => node(stmt.let()), preview: "let name =", add: (pos) => Project.addDetachedStatements([node(stmt.let())], pos) },
    { label: "set", kind: "statement", make: () => node(stmt.set()), preview: "set name =", add: (pos) => Project.addDetachedStatements([node(stmt.set())], pos) },
    { label: "for in", kind: "statement", make: () => node(stmt.forIn()), preview: "for item in", add: (pos) => Project.addDetachedStatements([node(stmt.forIn())], pos) },
    { label: "if statement", kind: "statement", make: () => node(stmt.if()), preview: "if condition", add: (pos) => Project.addDetachedStatements([node(stmt.if())], pos) },
    { label: "forever", kind: "statement", make: () => node(stmt.forever()), preview: "forever", add: (pos) => Project.addDetachedStatements([node(stmt.forever())], pos) },
    { label: "do", kind: "statement", make: () => node(stmt.do()), preview: "do expr", add: (pos) => Project.addDetachedStatements([node(stmt.do())], pos) },
    { label: "break", kind: "statement", make: () => node(stmt.break()), preview: "break", add: (pos) => Project.addDetachedStatements([node(stmt.break())], pos) },
    { label: "continue", kind: "statement", make: () => node(stmt.continue()), preview: "continue", add: (pos) => Project.addDetachedStatements([node(stmt.continue())], pos) },
    { label: "expression statement", kind: "statement", make: () => node(stmt.expression()), preview: "expr", add: (pos) => Project.addDetachedStatements([node(stmt.expression())], pos) },
    { label: "pass", kind: "statement", make: () => node(stmt.pass()), preview: "pass", add: (pos) => Project.addDetachedStatements([node(stmt.pass())], pos) },
    ...Project.document.customBlocks.map((block) => ({
      label: block.name,
      kind: block.syntaxKind,
      make: () => block.template,
      preview: block.name,
      add: (pos: Position) =>
        block.syntaxKind === "expression"
          ? Project.addDetachedExpression(block.template as any, pos)
          : Project.addDetachedStatements(block.template as any, pos),
    })),
  ];

  const filtered = items.filter(
    (item) => item.kind === props.context?.kind && item.label.toLowerCase().includes(filter.toLowerCase())
  );

  function workspacePosition(clientX: number, clientY: number): Position {
    const svg = document.getElementById("blockSpace") as unknown as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return props.context!.pos;
    return {
      x: (clientX - ctm.e) / ctm.a,
      y: (clientY - ctm.f) / ctm.d,
    };
  }

  function insertItem(item: InsertItem, evt: React.MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    if (props.context?.parentGuid && props.context.key && item.make && item.kind !== "declaration") {
      Project.placeSyntax(props.context.parentGuid, props.context.key, item.make(), props.context.idx, item.kind);
      props.onClose();
      return;
    }

    const id = item.add(workspacePosition(evt.clientX, evt.clientY));
    if (!id) {
      props.onClose();
      return;
    }

    const onMove = (moveEvt: MouseEvent) => {
      Project.updatePos(id, workspacePosition(moveEvt.clientX, moveEvt.clientY));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    props.onClose();
  }

  return (
    <aside className="insert-drawer">
      <header>
        <strong>Insert {props.context.kind}</strong>
        <button onClick={props.onClose}>Close</button>
      </header>
      <input
        autoFocus
        placeholder="Filter blocks..."
        value={filter}
        onChange={(evt) => setFilter(evt.target.value)}
        onKeyDown={(evt) => {
          if (evt.key === "Escape") props.onClose();
        }}
      />
      <ol>
        {filtered.map((item) => (
          <li key={`${item.kind}:${item.label}`}>
            <button
              title={item.label}
              onMouseDown={(evt) => insertItem(item, evt)}
            >
              <span className={`preview ${item.kind}`}>{item.preview}</span>
              <span className="label">{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export default InsertDrawer;
