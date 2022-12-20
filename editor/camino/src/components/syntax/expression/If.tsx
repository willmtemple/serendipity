import { If } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ _if: If }>("If", (props, ref) => (
  <SvgFlex ref={ref} direction="vertical" padding={20}>
    <SvgFlex direction="horizontal" align="middle" padding={20}>
      <text>if</text>
      <Expression bind={props._if} bindKey="cond" />
    </SvgFlex>
    <SvgFlex direction="horizontal" align="middle" padding={20}>
      <text>? then</text>
      <Expression bind={props._if} bindKey="then" />
    </SvgFlex>
    <SvgFlex direction="horizontal" align="middle" padding={20}>
      <text>: else</text>
      <Expression bind={props._if} bindKey="_else" />
    </SvgFlex>
  </SvgFlex>
));
