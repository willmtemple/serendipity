import { Tuple } from "@serendipity/syntax-surface";

import SvgFlex from "../../layout/SvgFlex";
import Expression from ".";
import Indent from "../../layout/Indent";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ tuple: Tuple }>("Tuple", (props, ref) => (
  <SvgFlex ref={ref} direction="vertical" padding={10}>
    <text>(</text>
    <Indent x={32}>
      <SvgFlex direction="vertical" padding={20}>
        {props.tuple.values.map((_, idx) => (
          <Expression key={idx} bind={props.tuple} bindKey="values" bindIdx={idx} />
        ))}
      </SvgFlex>
    </Indent>
    <text>)</text>
  </SvgFlex>
));
