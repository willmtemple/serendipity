import { With } from "@serendipity/syntax-surface";

import Indent from "../../layout/Indent";
import SvgFlex from "../../layout/SvgFlex";

import Expression from ".";
import NameSource from "../../editor/NameSource";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ with: With }>("With", (props, ref) => (
  <SvgFlex ref={ref} direction="vertical" padding={20}>
    <SvgFlex direction="horizontal" align="middle" padding={20}>
      <text>with</text>
      {/* Really don't change bindKey below to a number */}
      <NameSource binderProps={{ bind: props.with.binding, bindKey: "0" }} />
      <text>=</text>
      <Expression bind={props.with} bindKey="binding" bindIdx={1} />
    </SvgFlex>
    <Indent x={32}>
      <Expression bind={props.with} bindKey="expr" />
    </Indent>
  </SvgFlex>
));
