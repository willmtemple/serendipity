import { Tuple, Expression as SurfaceExpression } from "@serendipity/syntax-surface";

import SvgFlex from "../../layout/SvgFlex";
import Expression from ".";
import Indent from "../../layout/Indent";
import { syntax } from "../../../util/syntaxComponent";
import { useResizeParent } from "../../../hooks/measure";
import { Project } from "@serendipity/editor-stores";
import { observable } from "mobx";
import AddButton from "../../editor/AddButton";
import MinusButton from "../../editor/MinusButton";
import { SyntaxObject } from "@serendipity/syntax";

export default syntax<{ tuple: Tuple }>("Tuple", (props, ref) => {
  const resize = useResizeParent();
  function addValue() {
    const e: SurfaceExpression = {
      kind: "@hole",
    };

    Project.loadGUID(e as any);

    props.tuple.values.push(observable(e));
  }

  function removeValue(idx: number) {
    // This should be abstracted into the project.

    const tupleMetadata = Project.metadataFor(props.tuple as SyntaxObject);

    Project.detachExpression(tupleMetadata.guid, "values", { x: 0, y: 0 }, idx);

    props.tuple.values.splice(idx, 1);

    resize();
  }
  return (
    <SvgFlex ref={ref} direction="vertical" padding={10}>
      <text>(</text>
      <Indent x={32}>
        <SvgFlex direction="vertical" padding={20}>
          {props.tuple.values.map((_, idx) => (
            <SvgFlex key={idx} direction="horizontal" padding={10} align="middle">
              <MinusButton onClick={() => removeValue(idx)} />
              <Expression bind={props.tuple} bindKey="values" bindIdx={idx} />
            </SvgFlex>
          ))}
        </SvgFlex>
      </Indent>
      <SvgFlex direction="horizontal" align="middle" padding={10}>
        <text>)</text>
        <AddButton key="call_add_button" onClick={addValue} />
      </SvgFlex>
    </SvgFlex>
  );
});
