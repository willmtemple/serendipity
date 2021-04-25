import { observer } from "mobx-react";
import * as React from "react";

import * as surface from "@serendipity/syntax-surface";
import { useStores, EditorDetachedSyntax, EditorGlobal } from "@serendipity/editor-stores";

import CloseButton from "../../editor/CloseButton";

import BoundingBox from "../../layout/BoundingBox";

import Define from "./Define";
import DefineFunc from "./DefineFunc";
import Detached from "./Detached";
import Main from "./Main";

import { match } from "omnimatch";

export { Define, DefineFunc, Detached, Main };

function getColor(glb: surface.Global) {
  return (
    match(glb, {
      Define: () => "darkblue",
      DefineFunction: () => "darkviolet",
      Main: () => "maroon",
    }) ?? "black"
  );
}

const Global = React.forwardRef<any, { global: EditorGlobal }>((props, ref) => {
  const { Project } = useStores();

  function deleteNode() {
    Project.rmNodeByGUID(props.global.metadata.editor.guid);
  }

  const glb = props.global;
  const kind = glb.kind;

  if (kind === "_editor_detachedsyntax") {
    return <Detached ref={ref} onDelete={deleteNode} global={glb as EditorDetachedSyntax} />;
  }

  const body = match(glb, {
    Main: (glb) => <Main onDelete={deleteNode} main={glb} />,
    Define: (glb) => <Define onDelete={deleteNode} define={glb} />,
    DefineFunction: (glb) => <DefineFunc onDelete={deleteNode} definefunc={glb} />,
  }) ?? (
    <g ref={ref}>
      <CloseButton onClick={deleteNode} />
      <text style={{ fontFamily: "monospace", fontWeight: 900 }} y={20} x={32} fill="white">
        {glb.kind} (unimplemented)
      </text>
    </g>
  );

  const guid = glb.metadata.editor.guid;

  return (
    <BoundingBox
      ref={ref}
      color={getColor(glb as surface.Global)}
      containerProps={{ id: guid, className: "syntax global " + glb.kind.toLowerCase() }}
    >
      {body}
    </BoundingBox>
  );
});

export default observer(Global);
