import { observer } from "mobx-react";
import * as React from "react";

import { Print } from "@serendipity/syntax-surface";

import Expression from "../expression";
import { SvgFlex } from "../../layout";

const Print = React.forwardRef<SVGGElement, { print: Print }>((props, ref) => (
  <SvgFlex ref={ref} direction="horizontal" align="middle" padding={15}>
    <text>print</text>
    <Expression bind={props.print} bindKey="value" />
  </SvgFlex>
));

export default observer(Print);
