import { observer } from "mobx-react";
import * as React from "react";

import { ForIn } from "@serendipity/syntax-surface";

import SvgFlex from "../../layout/SvgFlex";
import Indent from "../../layout/Indent";

import Statement from ".";
import Expression from "../expression";
import NameSource from "../../editor/NameSource";

const ForIn = React.forwardRef<any, { forin: ForIn }>((props, ref) => (
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

export default observer(ForIn);
