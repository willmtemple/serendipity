import { ForIn } from "@serendipity/syntax-surface";

import SvgFlex from "../../layout/SvgFlex";
import Indent from "../../layout/Indent";

import Statement from ".";
import Expression from "../expression";
import NameSource from "../../editor/NameSource";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ forin: ForIn }>("ForIn", (props, ref) => (
  <SvgFlex ref={ref} direction="vertical" padding={20}>
    <SvgFlex direction="horizontal" padding={20}>
      <SvgFlex direction="horizontal" padding={20} align="middle">
        <text>for</text>
        <NameSource binderProps={{ bind: props.forin, bindKey: "binding" }} />
        <text>in</text>
      </SvgFlex>
      <Expression bind={props.forin} bindKey="value" />
    </SvgFlex>
    <Indent x={36}>
      <Statement bind={props.forin} bindKey="body" />
    </Indent>
  </SvgFlex>
));
