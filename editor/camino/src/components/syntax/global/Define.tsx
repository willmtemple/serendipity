import { observer } from "mobx-react";
import * as React from "react";

import * as global from "@serendipity/syntax-surface";

import CloseButton from "../../editor/CloseButton";
import Indent from "../../layout/Indent";
import Expression from "../expression";
import { SvgFlex } from "../../layout";
import NameSource from "../../editor/NameSource";

interface DefineProps {
  define: global.Define;

  onDelete(): void;
}

function Define(props: DefineProps, ref: React.ForwardedRef<SVGGElement>) {
  return (
    <g ref={ref}>
      <SvgFlex direction="horizontal" padding={10} align={"middle"}>
        <CloseButton onClick={props.onDelete} />
        <text>define</text>
        <NameSource binderProps={{ bind: props.define, bindKey: "name" }} />
      </SvgFlex>
      <Indent x={36} y={60}>
        <Expression bind={props.define} bindKey="value" />
      </Indent>
    </g>
  );
}

export default observer(React.forwardRef<SVGGElement, DefineProps>(Define));
