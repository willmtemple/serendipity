import { decl, expr, node, parameter, recordElement, stmt, type, useStores } from "@serendipity/editor-stores";
import React, { useEffect } from "react";

import type { Declaration, Expression, ParseNode, Statement } from "@serendipity/parser";

import { registerSource, unregister } from "../../util/Draggable";
import type { Position } from "../../util/Position";
import { BoundingBox, ExpressionBlock, Indent, StatementBlock, SvgFlex } from "../layout";

const paletteDeclarations: Array<[string, ParseNode<Declaration>]> = [
  ["main", decl.main()],
  ["const", decl.const()],
  ["function", decl.function("fn", [parameter("arg")])],
  ["import", decl.import()],
  ["export", decl.export()],
  ["type alias", decl.typeAlias()],
  ["interface", decl.interface()],
];

const paletteExprs: Array<[string, ParseNode<Expression>]> = [
  ["number", node(expr.number())],
  ["string", node(expr.string())],
  ["boolean", node(expr.boolean())],
  ["name", node(expr.name())],
  ["none", node(expr.none())],
  ["unary", node(expr.unary())],
  ["arithmetic", node(expr.arithmetic())],
  ["compare", node(expr.compare())],
  ["logical", node(expr.logical())],
  ["accessor", node(expr.accessor())],
  ["field", node(expr.fieldAccess())],
  ["function", node(expr.fn([parameter("arg")]))],
  ["call", node(expr.call())],
  ["with", node(expr.with())],
  ["tuple", node(expr.tuple())],
  ["list", node(expr.list())],
  ["procedure", node(expr.procedure())],
  ["if", node(expr.if())],
  ["record", node(expr.record([recordElement.keyValue()]))],
];

const paletteStatements: Array<[string, ParseNode<Statement>]> = [
  ["let", node(stmt.let())],
  ["set", node(stmt.set())],
  ["if", node(stmt.if())],
  ["for in", node(stmt.forIn())],
  ["forever", node(stmt.forever())],
  ["do", node(stmt.do())],
  ["break", node(stmt.break())],
  ["continue", node(stmt.continue())],
  ["pass", node(stmt.pass())],
  ["expression", node(stmt.expression())],
];

const paletteTypes = [
  ["reference", type.reference()],
  ["tuple", type.tuple()],
  ["union", type.union()],
  ["intersection", type.intersection()],
  ["function", type.fn()],
];

const Source = React.forwardRef<SVGGElement, {
  className: string;
  label: string;
  add(pos: Position): string;
  transform?: string;
  children: React.ReactNode;
}>((props, forwardedRef) => {
  const localRef = React.useRef<SVGGElement>(null);

  useEffect(() => {
    if (!localRef.current) return;
    const id = registerSource(props.add);
    (localRef.current as any)["data-ondetach"] = id;
    return () => unregister(id);
  });

  function setRef(element: SVGGElement | null) {
    localRef.current = element;
    if (typeof forwardedRef === "function") {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }

  return (
    <g ref={setRef} className={props.className} transform={props.transform}>
      {props.children}
    </g>
  );
});

Source.displayName = "Source";

function Palette() {
  const { Project } = useStores();
  const [show, setShow] = React.useState([true, true, true, false]);

  function invert(idx: number) {
    const next = [...show];
    next[idx] = !next[idx];
    setShow(next);
  }

  const contents: React.ReactNode[] = [
    <text className="button" key="g_label" onClick={() => invert(0)}>
      DECLARATIONS
    </text>,
    ...(show[0]
      ? paletteDeclarations.map(([label, item], idx) => (
          <Source
            key={`d_${idx}`}
            className="draggable syntax global source"
            label={label}
            add={(pos) => Project.addDeclaration(item, pos)}
          >
            <BoundingBox>
              <text transform="translate(0, 4)">{label}</text>
            </BoundingBox>
          </Source>
        ))
      : []),
    <text className="button" key="e_label" onClick={() => invert(1)}>
      EXPRESSIONS
    </text>,
    ...(show[1]
      ? paletteExprs.map(([label, item], idx) => (
          <Source
            key={`e_${idx}`}
            className="draggable syntax expression source"
            label={label}
            add={(pos) => Project.addDetachedExpression(item, pos)}
          >
            <ExpressionBlock>
              <text transform="translate(0, 4)">{label}</text>
            </ExpressionBlock>
          </Source>
        ))
      : []),
    <text className="button" key="s_label" onClick={() => invert(2)}>
      STATEMENTS
    </text>,
    ...(show[2]
      ? paletteStatements.map(([label, item], idx) => (
          <Source
            key={`s_${idx}`}
            className="draggable syntax statement source"
            label={label}
            add={(pos) => Project.addDetachedStatements([item], pos)}
          >
            <StatementBlock color="black">
              <text transform="translate(0, 4)">{label}</text>
            </StatementBlock>
          </Source>
        ))
      : []),
    <text className="button" key="t_label" onClick={() => invert(3)}>
      TYPES
    </text>,
    ...(show[3]
      ? paletteTypes.map(([label, item], idx) => (
          <BoundingBox key={`t_${idx}`}>
            <text transform="translate(0, 4)">
              {label}: {(item as { kind: string }).kind}
            </text>
          </BoundingBox>
        ))
      : []),
  ];

  return (
    <Indent x={12}>
      <SvgFlex direction="vertical" align="beginning" padding={20}>
        {contents}
      </SvgFlex>
    </Indent>
  );
}

export default Palette;
