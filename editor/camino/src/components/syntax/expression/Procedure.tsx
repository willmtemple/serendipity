import { Procedure } from "@serendipity/syntax-surface";
import { useStores } from "@serendipity/editor-stores";

import Indent from "../../layout/Indent";
import SvgFlex from "../../layout/SvgFlex";

import Statement from "../statement";
import { SyntaxObject } from "@serendipity/syntax";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ procedure: Procedure }>("Procedure", (props, ref) => {
  const { Project } = useStores();

  return (
    <g ref={ref}>
      <Indent x={3} y={3}>
        <SvgFlex direction="vertical" padding={-10}>
          {props.procedure.body.map((s, idx) => (
            <Statement
              key={Project.metadataFor(s as SyntaxObject).guid}
              bind={props.procedure}
              bindKey="body"
              bindIdx={idx}
            />
          ))}
        </SvgFlex>
      </Indent>
    </g>
  );
});
