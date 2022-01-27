import { IfStatement } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import { syntax } from "../../../util/syntaxComponent";
import Statement from ".";
import Expression from "../expression";

export default syntax<{ _if: IfStatement }>("If", (props, ref) => (
  <SvgFlex ref={ref} direction="vertical" padding={20}>
    <SvgFlex direction="horizontal" padding={20}>
      <text>if</text>
      <Expression bind={props._if} bindKey="condition" />
    </SvgFlex>
    <SvgFlex direction="horizontal" padding={20}>
      <text>then</text>
      <Statement bind={props._if} bindKey="body" />
    </SvgFlex>
    <SvgFlex direction="horizontal" padding={20}>
      <text>else</text>
      <Statement bind={props._if} bindKey="_else" />
    </SvgFlex>
  </SvgFlex>
));
