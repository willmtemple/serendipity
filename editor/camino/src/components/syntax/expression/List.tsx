import { List } from "@serendipity/syntax-surface";

import Expression from ".";
import SvgFlex from "../../layout/SvgFlex";
import Indent from "../../layout/Indent";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ list: List }>("List", (props, ref) => (
  <SvgFlex ref={ref} direction="vertical" padding={10}>
    <text>[</text>
    <Indent x={32}>
      <SvgFlex direction="vertical" padding={10}>
        {props.list.contents.map((_, idx) => (
          <Expression key={idx} bind={props.list} bindKey="contents" bindIdx={idx} />
        ))}
      </SvgFlex>
    </Indent>
    <text>]</text>
  </SvgFlex>
));
