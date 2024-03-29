import { Closure } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import AddButton from "../../editor/AddButton";
import Indent from "../../layout/Indent";
import NameSource from "../../editor/NameSource";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ closure: Closure }>("Closure", (props, ref) => {
  function addParam() {
    props.closure.parameters.push("new");
  }

  let binderLine = [<text key="s_clos_open_paren">(</text>];
  props.closure.parameters.forEach((p, idx) => {
    binderLine.push(
      <NameSource
        key={`clos_bind-${p}}`}
        binderProps={{ bind: props.closure.parameters, bindKey: idx }}
      />
    );
    if (idx < props.closure.parameters.length - 1) {
      binderLine.push(<text key={`s_clos_comma_${idx}`}>,</text>);
    }
  });
  binderLine = binderLine.concat([
    <text key="s_clos_close_paren">)</text>,
    <AddButton key="s_clos_add_button" onClick={addParam} />,
    <text key="s_clos_arrow">{"=>"}</text>,
  ]);

  return (
    <SvgFlex ref={ref} direction="vertical" padding={20}>
      <SvgFlex direction="horizontal" align="middle" padding={10}>
        {binderLine}
      </SvgFlex>
      <Indent x={36}>
        <Expression bind={props.closure} bindKey={"body"} />
      </Indent>
    </SvgFlex>
  );
});
