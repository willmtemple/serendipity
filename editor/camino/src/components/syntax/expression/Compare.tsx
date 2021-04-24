import { observer } from "mobx-react";
import * as React from "react";

import { Compare } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import { action } from "mobx";
import { DropDown } from "../../editor";

const operators: Compare["op"][] = ["!=", "<", "<=", "==", ">", ">="];

function Compare(props: { compare: Compare }, ref: React.ForwardedRef<unknown>) {
  const selectedIdx = operators.indexOf(props.compare.op);

  const setOp = action((op: Compare["op"]) => {
    props.compare.op = op;
  });
  return (
    <SvgFlex ref={ref} direction="horizontal" align="middle" padding={20}>
      <Expression bind={props.compare} bindKey={"left"} />
      <DropDown options={operators} selected={selectedIdx} onChange={setOp as (v: string) => {}} />
      <Expression bind={props.compare} bindKey={"right"} />
    </SvgFlex>
  );
}

export default observer(React.forwardRef<any, { compare: Compare }>(Compare));
