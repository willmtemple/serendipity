import { Print } from "@serendipity/syntax-surface";

import Expression from "../expression";
import { SvgFlex } from "../../layout";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ print: Print }>("Print", (props, ref) => (
  <SvgFlex ref={ref} direction="horizontal" align="middle" padding={15}>
    <text>print</text>
    <Expression bind={props.print} bindKey="value" />
  </SvgFlex>
));
