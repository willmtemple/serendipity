import { Accessor } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ accessor: Accessor }>("Accessor", (props, ref) => (
  <SvgFlex ref={ref} direction="horizontal" align="middle" padding={10}>
    <Expression bind={props.accessor} bindKey="accessee" />
    <text>[</text>
    <Expression bind={props.accessor} bindKey="index" />
    <text>]</text>
  </SvgFlex>
));
