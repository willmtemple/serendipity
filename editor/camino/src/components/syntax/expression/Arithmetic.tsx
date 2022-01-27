import { Arithmetic } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import { DropDown } from "../../editor";
import { action } from "mobx";
import { syntax } from "../../../util/syntaxComponent";

const operators: Arithmetic["op"][] = ["+", "-", "/", "*", "%"];

export default syntax<{ arithmetic: Arithmetic }>("Arithmetic", (props, ref) => {
  const selectedIdx = operators.indexOf(props.arithmetic.op);

  const setOp = action((op: Arithmetic["op"]) => {
    props.arithmetic.op = op;
  });

  return (
    <SvgFlex ref={ref} direction="horizontal" align="middle" padding={20}>
      <Expression bind={props.arithmetic} bindKey="left" />
      <DropDown
        options={operators}
        selected={selectedIdx}
        onChange={setOp as (v: string) => void}
      ></DropDown>
      <Expression bind={props.arithmetic} bindKey="right" />
    </SvgFlex>
  );
});
