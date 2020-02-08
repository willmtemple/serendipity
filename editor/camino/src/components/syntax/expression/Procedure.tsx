import { observer } from "mobx-react";
import * as React from "react";

import { Procedure } from "@serendipity/syntax-surface/dist/expression";
import { useStores } from "@serendipity/editor-stores";

import Indent from "../../layout/Indent";
import SvgFlex from "../../layout/SvgFlex";

import Statement from "../statement";

const Procedure = React.forwardRef<any, { procedure: Procedure }>((props, ref) => {
  const { Project } = useStores();

  return (
    <g ref={ref}>
      <text>{"<proc>"}</text>
      <Indent x={12} y={32}>
        <SvgFlex direction="vertical" padding={-10}>
          {props.procedure.body.map((s, idx) => (
            <Statement
              key={Project.metadataFor(s).guid}
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

export default observer(Procedure);

