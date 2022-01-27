import { Compare } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import { action } from "mobx";
import { DropDown } from "../../editor";
import { syntax } from "../../../util/syntaxComponent";

const operators: Compare["op"][] = ["!=", "<", "<=", "==", ">", ">="];

export default syntax<{ compare: Compare }>("Compare", (props, ref) => {
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
});
