import { observer } from "mobx-react";
import * as React from "react";

import type { Declaration, ParseNode } from "@serendipity/parser";
import { useStores, type EditorDetachedSyntax, type EditorGlobal, type EditorTopLevel } from "@serendipity/editor-stores";

import { Binder, CloseButton } from "../../editor";
import BoundingBox from "../../layout/BoundingBox";
import SvgFlex from "../../layout/SvgFlex";
import Expression from "../expression";
import Statement from "../statement";

function getColor(kind: string) {
  return {
    Main: "maroon",
    Const: "darkblue",
    Function: "darkviolet",
    Import: "darkgreen",
    Export: "darkorange",
    TypeAlias: "#333333",
    Interface: "#555555",
  }[kind] ?? "black";
}

function Detached(props: { global: EditorDetachedSyntax; onDelete(): void }) {
  return (
    <BoundingBox color="#555" containerProps={{ className: "syntax global detached" }}>
      <g>
        <SvgFlex direction="vertical" padding={10} align="beginning">
          <CloseButton onClick={props.onDelete} />
          <text>detached {props.global.syntaxKind}</text>
          {props.global.syntaxKind === "expression" ? (
            <Expression bind={props.global} bindKey="element" fixed />
          ) : (
            props.global.element.map((_, idx) => (
              <Statement key={idx} bind={props.global} bindKey="element" bindIdx={idx} fixed />
            ))
          )}
        </SvgFlex>
      </g>
    </BoundingBox>
  );
}

function DeclarationBody(props: { declaration: ParseNode<Declaration>; onDelete(): void }) {
  const declaration = props.declaration.value;
  switch (declaration.kind) {
    case "Main":
      return (
        <SvgFlex direction="vertical" padding={12} align="beginning">
          <SvgFlex direction="horizontal" padding={10} align="middle">
            <CloseButton onClick={props.onDelete} />
            <text>main</text>
          </SvgFlex>
          <Expression bind={declaration} bindKey="body" />
        </SvgFlex>
      );
    case "Const":
      return (
        <SvgFlex direction="vertical" padding={12} align="beginning">
          <SvgFlex direction="horizontal" padding={10} align="middle">
            <CloseButton onClick={props.onDelete} />
            <text>const</text>
            <Binder bind={declaration.identifier} bindKey="value" />
            <text>=</text>
          </SvgFlex>
          <Expression bind={declaration} bindKey="value" />
        </SvgFlex>
      );
    case "Function":
      return (
        <SvgFlex direction="vertical" padding={12} align="beginning">
          <SvgFlex direction="horizontal" padding={10} align="middle">
            <CloseButton onClick={props.onDelete} />
            <text>fn</text>
            <Binder bind={declaration.identifier} bindKey="value" />
            <text>(</text>
            {declaration.parameters.value.map((param, idx) => (
              <Binder key={idx} bind={param.value.name} bindKey="value" />
            ))}
            <text>) {"->"}</text>
          </SvgFlex>
          <Expression bind={declaration} bindKey="body" />
        </SvgFlex>
      );
    case "Import":
      return (
        <SvgFlex direction="horizontal" padding={10} align="middle">
          <CloseButton onClick={props.onDelete} />
          <text>import</text>
          <Binder bind={(declaration.pattern.value as any).name ?? declaration.moduleSpecifier} bindKey="value" />
          <text>use</text>
          <Binder bind={declaration.moduleSpecifier} bindKey="value" />
        </SvgFlex>
      );
    case "Export":
      return (
        <SvgFlex direction="horizontal" padding={10} align="middle">
          <CloseButton onClick={props.onDelete} />
          <text>export</text>
          <text>{declaration.elements.value.length} elements</text>
        </SvgFlex>
      );
    case "TypeAlias":
      return (
        <SvgFlex direction="horizontal" padding={10} align="middle">
          <CloseButton onClick={props.onDelete} />
          <text>type</text>
          <Binder bind={declaration.name} bindKey="value" />
          <text>= {declaration.value.value.kind}</text>
        </SvgFlex>
      );
    case "Interface":
      return (
        <SvgFlex direction="horizontal" padding={10} align="middle">
          <CloseButton onClick={props.onDelete} />
          <text>interface</text>
          <Binder bind={declaration.name} bindKey="value" />
          <text>{declaration.body.value.length} fields</text>
        </SvgFlex>
      );
    default:
      return null;
  }
}

const Global = observer(
  React.forwardRef<any, { global: EditorGlobal }>((props, ref) => {
    const { Project } = useStores();
    const onDelete = () => Project.rmNodeByGUID(Project.metadataFor(props.global).guid);

    if (props.global.kind === "_editor_detachedsyntax") {
      return <Detached global={props.global} onDelete={onDelete} />;
    }

    const topLevel = props.global as EditorTopLevel;
    const declaration = topLevel.declaration;
    const guid = Project.metadataFor(topLevel).guid;

    return (
      <BoundingBox
        ref={ref}
        color={getColor(declaration.value.kind)}
        containerProps={{ id: guid, className: "syntax global " + declaration.value.kind.toLowerCase() }}
      >
        <g>
          <DeclarationBody declaration={declaration} onDelete={onDelete} />
        </g>
      </BoundingBox>
    );
  })
);

Global.displayName = "Global";
export default Global;
