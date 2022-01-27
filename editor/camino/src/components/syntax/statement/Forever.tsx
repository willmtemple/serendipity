import { Forever } from "@serendipity/syntax-surface";
import Indent from "../../layout/Indent";

import Statement from ".";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ forever: Forever; transform?: string }>("ForIn", (props, ref) => (
  <g ref={ref} transform={props.transform}>
    <text>loop</text>
    <Indent x={32} y={32}>
      <Statement bind={props.forever} bindKey="body" />
    </Indent>
  </g>
));
