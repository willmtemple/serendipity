import { Define } from "@serendipity/syntax-surface";

import CloseButton from "../../editor/CloseButton";
import Indent from "../../layout/Indent";
import Expression from "../expression";
import { SvgFlex } from "../../layout";
import NameSource from "../../editor/NameSource";
import { syntax } from "../../../util/syntaxComponent";

interface DefineProps {
  define: Define;

  onDelete(): void;
}

export default syntax<DefineProps>("Define", (props, ref) => {
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
});
