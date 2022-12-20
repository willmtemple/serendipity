import { useStores } from "@serendipity/editor-stores";
import { Expression, Global, Statement } from "@serendipity/syntax-surface";
import { factory } from "omnimatch";
import React, { useEffect } from "react";
import { registerSource, unregister } from "../../util/Draggable";
import { Position } from "../../util/Position";
import { BoundingBox, ExpressionBlock, Indent, StatementBlock, SvgFlex } from "../layout";

const expr = factory<Expression>();
const stmt = factory<Statement>();
const global = factory<Global>();

const hole = () => expr["@hole"]({});

const paletteExprs: Expression[] = [
  expr.Accessor({ accessee: hole(), index: hole() }),
  expr.Arithmetic({ left: hole(), op: "+", right: hole() }),
  expr.Boolean({ value: false }),
  expr.Call({ callee: hole(), parameters: [] }),
  expr.Closure({ body: hole(), parameters: [] }),
  expr.Compare({ left: hole(), right: hole(), op: "==" }),
  expr.If({ cond: hole(), then: hole(), _else: hole() }),
  expr.List({ contents: [] }),
  expr.Name({ name: "" }),
  expr.Number({ value: 0 }),
  expr.Procedure({ body: [{ kind: "@hole" }] }),
  expr.Record({ data: {} }),
  expr.String({ value: "" }),
  expr.Tuple({ values: [] }),
  expr.Void({}),
  expr.With({ binding: ["_", hole()], expr: hole() }),
];

const paletteGlobals: Global[] = [
  global.Define({ name: "new", value: expr["@hole"]({}) }),
  global.DefineFunction({ name: "new", body: hole(), parameters: [] }),
  global.Main({ body: hole() }),
];

const paletteStatements: Statement[] = [
  stmt.Break({}),
  stmt.Do({ body: hole() }),
  stmt.ForIn({ body: { kind: "@hole" }, value: hole(), binding: "_" }),
  stmt.Forever({ body: { kind: "@hole" } }),
  stmt.If({ condition: hole(), body: { kind: "@hole" }, _else: { kind: "@hole" } }),
  stmt.Let({ name: "_", value: hole() }),
  stmt.Print({ value: hole() }),
];

const ExprSource = React.forwardRef(
  (props: { transform?: string; item: Expression }, ref: React.ForwardedRef<SVGElement>) => {
    const { Project } = useStores();

    const containerProps = {
      className: "draggable syntax expression source " + props.item.kind.toLowerCase(),
    };

    useEffect(() => {
      if ((ref as React.MutableRefObject<SVGGElement>).current) {
        const id = registerSource((pos: Position) =>
          Project.addGlobal(
            {
              kind: "_editor_detachedsyntax",
              syntaxKind: "expression",
              element: { ...props.item },
            },
            pos
          )
        );

        (ref as any).current["data-ondetach"] = id;

        return () => {
          unregister(id);
        };
      }
    });

    return (
      <ExpressionBlock ref={ref} containerProps={containerProps} transform={props.transform}>
        <text transform="translate(0, 4)">{props.item.kind}</text>
      </ExpressionBlock>
    );
  }
);

const StmtSource = React.forwardRef(
  (props: { transform?: string; item: Statement }, ref: React.ForwardedRef<SVGElement>) => {
    const { Project } = useStores();

    const containerProps = {
      className: "draggable syntax statement source " + props.item.kind.toLowerCase(),
      transform: props.transform,
    };

    useEffect(() => {
      if ((ref as React.MutableRefObject<SVGGElement>).current) {
        const id = registerSource((pos: Position) =>
          Project.addGlobal(
            {
              kind: "_editor_detachedsyntax",
              syntaxKind: "statement",
              element: [{ ...props.item }],
            },
            pos
          )
        );

        (ref as any).current["data-ondetach"] = id;

        return () => {
          unregister(id);
        };
      }
    });

    return (
      <StatementBlock ref={ref} containerProps={containerProps}>
        <text transform="translate(0, 4)">{props.item.kind}</text>
      </StatementBlock>
    );
  }
);

const GlblSource = React.forwardRef(
  (props: { transform?: string; item: Global }, ref: React.ForwardedRef<SVGElement>) => {
    const { Project } = useStores();

    const containerProps = {
      className: "draggable syntax global source " + props.item.kind.toLowerCase(),
      transform: props.transform,
    };

    useEffect(() => {
      if ((ref as React.MutableRefObject<SVGGElement>).current) {
        const id = registerSource((pos: Position) => Project.addGlobal({ ...props.item }, pos));

        (ref as any).current["data-ondetach"] = id;

        return () => {
          unregister(id);
        };
      }
    });

    return (
      <BoundingBox ref={ref} containerProps={containerProps}>
        <text transform="translate(0, 4)">{props.item.kind}</text>
      </BoundingBox>
    );
  }
);

function Palette() {
  const [show, setShow] = React.useState([false, false, true]);

  function invert(idx: number) {
    const next = [...show];
    next[idx] = !next[idx];
    setShow(next);
  }

  const contents = [
    <text className="button" key="g_label" onClick={() => invert(0)}>
      GLOBALS
    </text>,
    ...(show[0]
      ? paletteGlobals.map((v, idx) => {
          return <GlblSource key={`g_${idx}`} item={v} />;
        })
      : []),
    <text className="button" key="e_label" onClick={() => invert(1)}>
      EXPRESSIONS
    </text>,
    ...(show[1]
      ? paletteExprs.map((v, idx) => {
          return <ExprSource key={`e_${idx}`} item={v} />;
        })
      : []),
    <text className="button" key="s_label" onClick={() => invert(2)}>
      STATEMENTS
    </text>,
    ...(show[2]
      ? paletteStatements.map((v, idx) => {
          return <StmtSource key={`s_${idx}`} item={v} />;
        })
      : []),
  ];

  return (
    <Indent x={12}>
      <SvgFlex direction="vertical" align="beginning" padding={20}>
        {...contents}
      </SvgFlex>
    </Indent>
  );
}

export default Palette;
