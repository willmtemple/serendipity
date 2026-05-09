import { observer } from "mobx-react";
import * as React from "react";

import type { Declaration, ParseNode } from "@serendipity/parser";
import { useStores, type EditorDetachedSyntax, type EditorGlobal, type EditorTopLevel } from "@serendipity/editor-stores";

import { Binder, CloseButton } from "../../editor";
import BoundingBox from "../../layout/BoundingBox";
import SvgFlex from "../../layout/SvgFlex";
import Expression from "../expression";
import Statement from "../statement";
import { useInteractionState } from "../../../interaction";

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

function Detached(props: { global: EditorDetachedSyntax }) {
  return props.global.syntaxKind === "expression" ? (
    <Expression bind={props.global} bindKey="element" fixed />
  ) : (
    <SvgFlex direction="vertical" padding={10} align="beginning">
      {props.global.element.map((_, idx) => (
        <Statement key={idx} bind={props.global} bindKey="element" bindIdx={idx} fixed />
      ))}
    </SvgFlex>
  );
}

function DeclarationBody(props: { declaration: ParseNode<Declaration>; onDelete(): void }) {
  const declaration = props.declaration.value;
  const Header = ({ children }: React.PropsWithChildren) => (
    <SvgFlex direction="horizontal" padding={10} align="middle">
      <CloseButton onClick={props.onDelete} />
      {children}
    </SvgFlex>
  );

  switch (declaration.kind) {
    case "Main":
      return (
        <SvgFlex direction="vertical" padding={10} align="beginning">
          <Header>
            <text className="keyword-token">main</text>
          </Header>
          <Expression bind={declaration} bindKey="body" />
        </SvgFlex>
      );
    case "Const":
      return (
        <SvgFlex direction="vertical" padding={10} align="beginning">
          <Header>
            <text className="keyword-token">const</text>
            <Binder bind={declaration.identifier} bindKey="value" />
            <text className="operator-token">=</text>
          </Header>
          <Expression bind={declaration} bindKey="value" />
        </SvgFlex>
      );
    case "Function":
      return (
        <SvgFlex direction="vertical" padding={10} align="beginning">
          <Header>
            <text className="keyword-token">fn</text>
            <Binder bind={declaration.identifier} bindKey="value" />
            <text className="punctuation-token">(</text>
            {declaration.parameters.value.map((param, idx) => (
              <React.Fragment key={idx}>
                <Binder bind={param.value.name} bindKey="value" />
                {idx < declaration.parameters.value.length - 1 ? <text className="punctuation-token">,</text> : null}
              </React.Fragment>
            ))}
            <text className="punctuation-token">)</text>
            <text className="operator-token">{"->"}</text>
          </Header>
          <Expression bind={declaration} bindKey="body" />
        </SvgFlex>
      );
    case "Import":
      return (
        <Header>
          <text className="keyword-token">import</text>
          <Binder bind={(declaration.pattern.value as any).name ?? declaration.moduleSpecifier} bindKey="value" />
          <text className="keyword-token">use</text>
          <Binder bind={declaration.moduleSpecifier} bindKey="value" />
        </Header>
      );
    case "Export":
      return (
        <Header>
          <text className="keyword-token">export</text>
          <text>{declaration.elements.value.length} elements</text>
        </Header>
      );
    case "TypeAlias":
      return (
        <Header>
          <text className="keyword-token">type</text>
          <Binder bind={declaration.name} bindKey="value" />
          <text className="operator-token">=</text>
          <text>{declaration.value.value.kind}</text>
        </Header>
      );
    case "Interface":
      return (
        <Header>
          <text className="keyword-token">interface</text>
          <Binder bind={declaration.name} bindKey="value" />
          <text>{declaration.body.value.length} fields</text>
        </Header>
      );
    default:
      return null;
  }
}

const Global = observer(
  React.forwardRef<any, { global: EditorGlobal }>((props, ref) => {
    const { Project } = useStores();
    const interaction = useInteractionState();
    const onDelete = () => Project.rmNodeByGUID(Project.metadataFor(props.global).guid);

    if (props.global.kind === "_editor_detachedsyntax") {
      return <Detached global={props.global} />;
    }

    const topLevel = props.global as EditorTopLevel;
    const declaration = topLevel.declaration;
    const guid = Project.metadataFor(topLevel).guid;

    return (
      <BoundingBox
        ref={ref}
        color={getColor(declaration.value.kind)}
        containerProps={{
          id: guid,
          className:
            "syntax global " +
            declaration.value.kind.toLowerCase() +
            (interaction.selectedGuid === guid ? " selected" : "") +
            (interaction.snapParentGuid === guid ? " snap-parent" : ""),
        }}
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
