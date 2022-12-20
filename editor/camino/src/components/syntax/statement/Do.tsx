import { Do } from "@serendipity/syntax-surface";
import Expression from "../expression";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ do: Do }>("Do", (props, ref) => (
  <Expression ref={ref} bind={props.do} bindKey="body" />
));
