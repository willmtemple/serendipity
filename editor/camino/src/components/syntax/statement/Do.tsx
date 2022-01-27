import { Do } from "@serendipity/syntax-surface";
import Indent from "../../layout/Indent";
import Expression from "../expression";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ do: Do }>("Do", (props, ref) => (
  <g ref={ref}>
    <text>do</text>
    <Indent x={32}>
      <Expression bind={props.do} bindKey="body" />
    </Indent>
  </g>
));
