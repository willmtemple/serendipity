import { observer } from "mobx-react";
import * as React from "react";

import type { ParseNode, Statement as ParserStatement } from "@serendipity/parser";
import { useStores } from "@serendipity/editor-stores";

import { Binder, StatementHole } from "../../editor";
import StatementBlock from "../../layout/StatementBlock";
import SvgFlex from "../../layout/SvgFlex";
import Expression from "../expression";
import { useInteractionState } from "../../../interaction";

interface StatementProps {
  bind: any;
  bindKey: string;
  bindIdx?: number;
  transform?: string;
  fixed?: boolean;
}

function getColor(kind: string) {
  switch (kind) {
    case "Expression":
    case "Do":
      return "var(--camino-statement)";
    case "ForIn":
      return "var(--camino-statement)";
    case "If":
      return "var(--camino-control)";
    default:
      return "var(--camino-statement)";
  }
}

const Statement = observer(
  React.forwardRef<unknown, StatementProps>((props, ref) => {
    const { Project } = useStores();
    const interaction = useInteractionState();
    const stmtNode = (props.bindIdx === undefined
      ? props.bind[props.bindKey]
      : props.bind[props.bindKey][props.bindIdx]) as ParseNode<ParserStatement>;
    const parentGuid = Project.metadataFor(props.bind).guid;

    if (!stmtNode?.value) {
      return (
        <StatementHole
          ref={ref as React.ForwardedRef<SVGPathElement>}
          kind="statement"
          bind={props.bind}
          bindKey={props.bindKey}
          bindIdx={props.bindIdx}
          transform={props.transform}
        />
      );
    }

    const stmt = stmtNode.value;

    if ((stmt as { kind?: string }).kind === "Hole") {
      return (
        <StatementHole
          ref={ref as React.ForwardedRef<SVGPathElement>}
          kind="statement"
          bind={props.bind}
          bindKey={props.bindKey}
          bindIdx={props.bindIdx}
          transform={props.transform}
        />
      );
    }

    const body = (() => {
      switch (stmt.kind) {
        case "Let":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className="keyword-token">let</text>
              <Binder bind={stmt.assignment.value.symbol} bindKey="value" />
              <text className="operator-token">=</text>
              <Expression bind={stmt.assignment.value} bindKey="value" />
            </SvgFlex>
          );
        case "Set":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className="keyword-token">set</text>
              <Binder bind={stmt[0].value.symbol} bindKey="value" />
              <text className="operator-token">=</text>
              <Expression bind={stmt[0].value} bindKey="value" />
            </SvgFlex>
          );
        case "If":
          return (
            <SvgFlex direction="vertical" padding={10} align="beginning">
              <SvgFlex direction="horizontal" padding={8} align="middle">
                <text className="control-token">if</text>
                <Expression bind={stmt} bindKey="condition" />
              </SvgFlex>
              <Statement bind={stmt} bindKey="then" fixed />
              {stmt.Else ? <Statement bind={stmt.Else.value} bindKey="body" fixed /> : <text>no else</text>}
            </SvgFlex>
          );
        case "ForIn":
          return (
            <SvgFlex direction="vertical" padding={10} align="beginning">
              <SvgFlex direction="horizontal" padding={8} align="middle">
                <text className="keyword-token">for</text>
                <Binder bind={stmt.binding} bindKey="value" />
                <text className="keyword-token">in</text>
                <Expression bind={stmt} bindKey="iterator" />
              </SvgFlex>
              <Statement bind={stmt} bindKey="body" fixed />
            </SvgFlex>
          );
        case "Forever":
          return (
            <SvgFlex direction="vertical" padding={10} align="beginning">
              <text className="keyword-token">forever</text>
              <Statement bind={stmt} bindKey="0" fixed />
            </SvgFlex>
          );
        case "Do":
        case "Expression":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className={stmt.kind === "Do" ? "keyword-token" : "punctuation-token"}>{stmt.kind === "Do" ? "do" : "expr"}</text>
              <Expression bind={stmt} bindKey="0" />
            </SvgFlex>
          );
        case "Break":
          return <text className="keyword-token">break</text>;
        case "Continue":
          return <text className="keyword-token">continue</text>;
        case "Pass":
          return <text className="keyword-token">pass</text>;
      }
    })();

    const guid = Project.metadataFor(stmtNode).guid;
    const valueGuid = Project.metadataFor(stmt).guid;
    const containerProps: Record<string, unknown> = {
      id: guid,
      className:
        (props.fixed ? "" : "draggable ") +
        "syntax statement " +
        stmt.kind.toLowerCase() +
        (interaction.hoveredGuid === guid ? " hovered" : "") +
        (interaction.selectedGuid === guid ? " selected" : "") +
        (interaction.snapParentGuid === guid || interaction.snapParentGuid === valueGuid ? " snap-parent" : ""),
      "data-guid": guid,
      "data-value-guid": valueGuid,
      "data-parent-guid": parentGuid,
      "data-mutation-key": props.bindKey,
    };
    if (props.bindIdx !== undefined) containerProps["data-mutation-idx"] = props.bindIdx;

    return (
      <StatementBlock
        ref={ref}
        color={getColor(stmt.kind)}
        containerProps={containerProps}
        {...(props.transform === undefined ? {} : { transform: props.transform })}
      >
        {body}
      </StatementBlock>
    );
  })
);

Statement.displayName = "Statement";
export default Statement;
