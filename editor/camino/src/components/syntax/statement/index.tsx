import { observer } from "mobx-react";
import * as React from "react";

import type { ParseNode, Statement as ParserStatement } from "@serendipity/parser";
import { useStores } from "@serendipity/editor-stores";

import { Binder, StatementHole } from "../../editor";
import StatementBlock from "../../layout/StatementBlock";
import SvgFlex from "../../layout/SvgFlex";
import Expression from "../expression";

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
      return "#1F75FE";
    case "ForIn":
      return "grey";
    case "If":
      return "#B03060";
    default:
      return "black";
  }
}

const Statement = observer(
  React.forwardRef<unknown, StatementProps>((props, ref) => {
    const { Project } = useStores();
    const stmtNode = (props.bindIdx === undefined
      ? props.bind[props.bindKey]
      : props.bind[props.bindKey][props.bindIdx]) as ParseNode<ParserStatement>;
    const stmt = stmtNode.value;

    const body = (() => {
      switch (stmt.kind) {
        case "Let":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text>let</text>
              <Binder bind={stmt.assignment.value.symbol} bindKey="value" />
              <text>=</text>
              <Expression bind={stmt.assignment.value} bindKey="value" />
            </SvgFlex>
          );
        case "Set":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text>set</text>
              <Binder bind={stmt[0].value.symbol} bindKey="value" />
              <text>=</text>
              <Expression bind={stmt[0].value} bindKey="value" />
            </SvgFlex>
          );
        case "If":
          return (
            <SvgFlex direction="vertical" padding={10} align="beginning">
              <SvgFlex direction="horizontal" padding={8} align="middle">
                <text>if</text>
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
                <text>for</text>
                <Binder bind={stmt.binding} bindKey="value" />
                <text>in</text>
                <Expression bind={stmt} bindKey="iterator" />
              </SvgFlex>
              <Statement bind={stmt} bindKey="body" fixed />
            </SvgFlex>
          );
        case "Forever":
          return (
            <SvgFlex direction="vertical" padding={10} align="beginning">
              <text>forever</text>
              <Statement bind={stmt} bindKey="0" fixed />
            </SvgFlex>
          );
        case "Do":
        case "Expression":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text>{stmt.kind === "Do" ? "do" : "expr"}</text>
              <Expression bind={stmt} bindKey="0" />
            </SvgFlex>
          );
        case "Break":
          return <text>break</text>;
        case "Continue":
          return <text>continue</text>;
        case "Pass":
          return <text>pass</text>;
      }
    })();

    const guid = Project.metadataFor(stmtNode).guid;
    const parentGuid = Project.metadataFor(props.bind).guid;
    const containerProps: Record<string, unknown> = {
      id: guid,
      className: (props.fixed ? "" : "draggable ") + "syntax statement " + stmt.kind.toLowerCase(),
      "data-guid": guid,
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
