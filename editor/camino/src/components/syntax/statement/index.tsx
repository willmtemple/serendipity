import { observer } from "mobx-react";
import * as React from "react";

import { SyntaxObject } from "@serendipity/syntax";
import * as surface from "@serendipity/syntax-surface";
import { useStores } from "@serendipity/editor-stores";

import SyntaxHole from "../../editor/StatementHole";

import StatementBlock from "../../layout/StatementBlock";

import Do from "./Do";
import ForIn from "./ForIn";
import Print from "./Print";
import { match } from "omnimatch";
import Break from "./Break";
import Forever from "./Forever";
import If from "./If";

export { Do, ForIn, Print };

function getColor(kind: string) {
  switch (kind) {
    case "Print":
      return "#1F75FE";
    case "ForIn":
      return "grey";
    default:
      return "black";
  }
}

interface StatementProps {
  bind: unknown;
  bindKey: string;
  bindIdx?: number;

  transform?: string;

  fixed?: boolean;
}

const Statement = observer(
  React.forwardRef<unknown, StatementProps>((props, ref) => {
    const { Project } = useStores();

    const stmt = (props.bindIdx === undefined
      ? (props.bind as any)[props.bindKey]
      : ((props.bind as any)[props.bindKey] as any)[props.bindIdx]) as surface.Statement;

    if (stmt.kind === "@hole") {
      return (
        <SyntaxHole
          ref={ref as React.ForwardedRef<SVGPathElement>}
          transform={props.transform}
          bind={props.bind as SyntaxObject}
          bindKey={props.bindKey as string}
          bindIdx={props.bindIdx}
          kind="statement"
        />
      );
    }

    const body = match(stmt, {
      Print: (stmt) => <Print print={stmt} />,
      ForIn: (stmt) => <ForIn forin={stmt} />,
      Do: (stmt) => <Do do={stmt} />,
      Break: (_) => <Break />,
      Forever: (stmt) => <Forever forever={stmt} />,
      If: (stmt) => <If _if={stmt} />,
    }) ?? (
      <text
        ref={ref as React.ForwardedRef<SVGTextElement>}
        fill="white"
        fontFamily="Source Code Pro"
        fontWeight="600"
      >
        {stmt.kind} (unimplemented)
      </text>
    );

    // Set up node metadata for DOM access
    const containerProps: { [k: string]: any } = {};
    const guid = Project.metadataFor(stmt as SyntaxObject).guid;
    containerProps.id = guid;
    containerProps.className =
      (props.fixed ? "" : "draggable ") + "syntax statement " + stmt.kind.toLowerCase();
    containerProps["data-guid"] = guid;
    containerProps["data-parent-guid"] = Project.metadataFor(props.bind as SyntaxObject).guid;
    containerProps["data-mutation-key"] = props.bindKey;
    if (props.bindIdx !== undefined) {
      containerProps["data-mutation-idx"] = props.bindIdx;
    }

    return (
      <StatementBlock ref={ref} color={getColor(stmt.kind)} containerProps={containerProps}>
        {body}
      </StatementBlock>
    );
  })
);

Statement.displayName = "Statement";

export default Statement;
