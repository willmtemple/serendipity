import { observer } from "mobx-react";
import * as React from "react";

import type { Expression as ParserExpression, ParseNode, RecordElement } from "@serendipity/parser";
import { useStores } from "@serendipity/editor-stores";

import { AddButton, Binder, ExpressionHole } from "../../editor";
import { expr as makeExpr, node as makeNode } from "@serendipity/editor-stores";
import { ExpressionBlock, SvgFlex } from "../../layout";
import Statement from "../statement";

export interface ExpressionProps {
  bind: any;
  bindKey: string;
  bindIdx?: number;
  transform?: string;
  fixed?: boolean;
}

function labelForOperator(op: { kind: string }) {
  return {
    Add: "+",
    Subtract: "-",
    Multiply: "*",
    Divide: "/",
    Modulus: "%",
    Equal: "==",
    NotEqual: "!=",
    LessThan: "<",
    LessThanOrEqual: "<=",
    GreaterThan: ">",
    GreaterThanOrEqual: ">=",
    And: "and",
    Or: "or",
    Negate: "not",
    Minus: "-",
  }[op.kind] ?? op.kind;
}

const ExpressionChild = React.forwardRef<SVGGElement, { bind: any; bindKey: string; bindIdx?: number; fixed?: boolean }>(
  (props, ref) => {
  return (
    <Expression
      ref={ref}
      bind={props.bind}
      bindKey={props.bindKey}
      {...(props.bindIdx === undefined ? {} : { bindIdx: props.bindIdx })}
      {...(props.fixed === undefined ? {} : { fixed: props.fixed })}
    />
  );
  }
);
ExpressionChild.displayName = "ExpressionChild";

const ExprList = React.forwardRef<SVGGElement, { list: ParseNode<Array<ParseNode<ParserExpression>>>; separator?: string }>(
  (props, ref) => {
  const children: React.ReactNode[] = [];
  props.list.value.forEach((_, idx) => {
    children.push(<ExpressionChild key={`expr-${idx}`} bind={props.list} bindKey="value" bindIdx={idx} />);
    if (idx < props.list.value.length - 1) children.push(<text className="punctuation-token" key={`sep-${idx}`}>{props.separator ?? ","}</text>);
  });
  children.push(<AddButton key="add" onClick={() => props.list.value.push(makeNode(makeExpr.hole()))} />);
  return (
    <SvgFlex ref={ref} direction="horizontal" padding={6} align="middle">
      {children}
    </SvgFlex>
  );
  }
);
ExprList.displayName = "ExprList";

const RecordElementView = React.forwardRef<SVGGElement, { element: ParseNode<RecordElement> }>((props, ref) => {
  const element = props.element.value;
  if (element.kind === "KeyValuePair") {
    return (
      <SvgFlex ref={ref} direction="horizontal" padding={8} align="middle">
        <Binder bind={element.key} bindKey="value" />
        <text className="punctuation-token">:</text>
        <ExpressionChild bind={element} bindKey="value" />
      </SvgFlex>
    );
  }
  if (element.kind === "Identifier") {
    return (
      <g ref={ref}>
        <Binder bind={element.name} bindKey="value" />
      </g>
    );
  }
  return (
    <SvgFlex ref={ref} direction="horizontal" padding={8} align="middle">
      <text className="punctuation-token">...</text>
      <ExpressionChild bind={element} bindKey="value" />
    </SvgFlex>
  );
});
RecordElementView.displayName = "RecordElementView";

const Expression = observer(
  React.forwardRef<unknown, React.PropsWithChildren<ExpressionProps>>((props, ref) => {
    const { Project } = useStores();
    const exprNode = (props.bindIdx === undefined
      ? props.bind[props.bindKey]
      : props.bind[props.bindKey][props.bindIdx]) as ParseNode<ParserExpression>;
    const expr = exprNode.value;
    if (!expr || typeof expr.kind !== "string") {
      return (
        <ExpressionBlock ref={ref} transform={props.transform}>
          <text>invalid expression</text>
        </ExpressionBlock>
      );
    }

    if (expr.kind === "Hole") {
      return (
        <ExpressionHole
          ref={ref as React.ForwardedRef<SVGPathElement>}
          transform={props.transform}
          bind={props.bind}
          bindKey={props.bindKey}
          bindIdx={props.bindIdx}
          kind="expression"
        />
      );
    }

    const body = (() => {
      switch (expr.kind) {
        case "Number":
        case "String":
        case "Boolean":
        case "Name":
          return <Binder bind={expr} bindKey={0} />;
        case "None":
          return <text className="literal-token">none</text>;
        case "Unary":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className="operator-token">{labelForOperator(expr.operator.value)}</text>
              <ExpressionChild bind={expr} bindKey="expression" />
            </SvgFlex>
          );
        case "Arithmetic":
        case "Compare":
        case "Logical":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <ExpressionChild bind={expr} bindKey="left" />
              <text className="operator-token">{labelForOperator(expr.operator.value)}</text>
              <ExpressionChild bind={expr} bindKey="right" />
            </SvgFlex>
          );
        case "Accessor":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <ExpressionChild bind={expr} bindKey="accessee" />
              <text className="punctuation-token">[</text>
              <ExpressionChild bind={expr} bindKey="index" />
              <text className="punctuation-token">]</text>
            </SvgFlex>
          );
        case "FieldAccess":
          return (
            <SvgFlex direction="horizontal" padding={4} align="middle">
              <ExpressionChild bind={expr} bindKey="accessee" />
              <text className="punctuation-token">.</text>
              <Binder bind={expr.field} bindKey="value" />
            </SvgFlex>
          );
        case "Function": {
          const parameterChildren: React.ReactNode[] = [];
          expr.parameters.value.forEach((param: any, idx: number) => {
            parameterChildren.push(<Binder key={`param-${idx}`} bind={param.value.name} bindKey="value" />);
            if (idx < expr.parameters.value.length - 1) {
              parameterChildren.push(<text className="punctuation-token" key={`param-sep-${idx}`}>,</text>);
            }
          });
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className="keyword-token">fn</text>
              <text className="punctuation-token">(</text>
              {parameterChildren}
              <AddButton onClick={() => expr.parameters.value.push({ ...expr.parameters.value[0], value: { name: { ...expr.fnKeyword, value: "arg" } } } as any)} />
              <text className="operator-token">{"->"}</text>
              <ExpressionChild bind={expr} bindKey="body" />
            </SvgFlex>
          );
        }
        case "Call":
          return (
            <SvgFlex direction="horizontal" padding={6} align="middle">
              <ExpressionChild bind={expr} bindKey="callee" />
              <text className="call-token">(</text>
              <ExprList list={expr.parameters} />
              <text className="call-token">)</text>
            </SvgFlex>
          );
        case "With": {
          const bindingChildren: React.ReactNode[] = [];
          expr.bindings.value.forEach((binding: any, idx: number) => {
            bindingChildren.push(
              <Binder key={`binding-name-${idx}`} bind={binding.value.symbol} bindKey="value" />
            );
            bindingChildren.push(<text className="operator-token" key={`binding-eq-${idx}`}>=</text>);
            bindingChildren.push(
              <ExpressionChild key={`binding-value-${idx}`} bind={binding.value} bindKey="value" />
            );
          });
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className="keyword-token">with</text>
              {bindingChildren}
              <ExpressionChild bind={expr} bindKey="body" />
            </SvgFlex>
          );
        }
        case "Tuple":
        case "List":
          return (
            <SvgFlex direction="horizontal" padding={6} align="middle">
              <text className="punctuation-token">{expr.kind === "Tuple" ? "(" : "["}</text>
              <ExprList list={expr.elements} />
              <text className="punctuation-token">{expr.kind === "Tuple" ? ")" : "]"}</text>
            </SvgFlex>
          );
        case "Procedure":
          return (
            <SvgFlex direction="vertical" padding={10} align="beginning">
              <text className="keyword-token">do</text>
              {expr.body.value.map((_, idx: number) => (
                <Statement key={idx} bind={expr.body} bindKey="value" bindIdx={idx} fixed />
              ))}
            </SvgFlex>
          );
        case "If":
          return (
            <SvgFlex direction="vertical" padding={8} align="beginning">
              <SvgFlex direction="horizontal" padding={8} align="middle">
                <text className="control-token">if</text>
                <ExpressionChild bind={expr} bindKey="condition" />
              </SvgFlex>
              <SvgFlex direction="horizontal" padding={8} align="middle">
                <text className="control-token">then</text>
                <ExpressionChild bind={expr} bindKey="then" />
              </SvgFlex>
              <SvgFlex direction="horizontal" padding={8} align="middle">
                <text className="control-token">else</text>
                <ExpressionChild bind={expr} bindKey="Else" />
              </SvgFlex>
            </SvgFlex>
          );
        case "Record":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <text className="punctuation-token">{"{"}</text>
              {expr.elements.value.map((element, idx) => (
                <RecordElementView key={idx} element={element} />
              ))}
              <text className="punctuation-token">{"}"}</text>
            </SvgFlex>
          );
        case "As":
          return (
            <SvgFlex direction="horizontal" padding={8} align="middle">
              <ExpressionChild bind={expr} bindKey="expr" />
              <text className="keyword-token">as</text>
              <text>type</text>
            </SvgFlex>
          );
      }
    })();

    const guid = Project.metadataFor(exprNode).guid;
    const parentGuid = Project.metadataFor(props.bind).guid;
    const containerProps: Record<string, unknown> = {
      id: guid,
      className: (props.fixed ? "" : "draggable ") + "syntax expression " + expr.kind.toLowerCase(),
      "data-guid": guid,
      "data-parent-guid": parentGuid,
      "data-mutation-key": props.bindKey,
    };
    if (props.bindIdx !== undefined) containerProps["data-mutation-idx"] = props.bindIdx;

    return (
      <ExpressionBlock ref={ref} containerProps={containerProps} transform={props.transform}>
        {body}
      </ExpressionBlock>
    );
  })
);

Expression.displayName = "Expression";
export default Expression;
