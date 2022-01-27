import Indent from "../../layout/Indent";
import SvgFlex from "../../layout/SvgFlex";

import AddButton from "../../editor/AddButton";
import CloseButton from "../../editor/CloseButton";

import Expression from "../expression";
import NameSource from "../../editor/NameSource";
import { DefineFunction } from "@serendipity/syntax-surface";
import { syntax } from "../../../util/syntaxComponent";

interface DefineFuncProps {
  definefunc: DefineFunction;

  onDelete(): void;
}

export default syntax<DefineFuncProps>("DefineFunction", (props, ref) => {
  function addParam() {
    props.definefunc.parameters.push("new");
  }

  let binderLine = [
    <text key="s_dfn_label">define</text>,
    <NameSource key="s_dfn_name" binderProps={{ bind: props.definefunc, bindKey: "name" }} />,
    <text key="s_dfn_open_paren">(</text>,
  ];

  props.definefunc.parameters.forEach((p, idx) => {
    binderLine.push(
      <NameSource
        key={`dfn_bind-${p}-${idx}`}
        binderProps={{ bind: props.definefunc.parameters, bindKey: idx }}
      />
    );
    if (idx < props.definefunc.parameters.length - 1) {
      binderLine.push(<text key={`s_dfn_comma_${idx}`}>,</text>);
    }
  });

  binderLine = binderLine.concat([
    <text key="s_dfn_close_paren">)</text>,
    <AddButton key="s_dfn_add_button" onClick={addParam} />,
    <text key="s_dfn_arrow">{"=>"}</text>,
  ]);

  const finalChildren = [
    <CloseButton key="s_dfn_close_button" onClick={props.onDelete} />,
    ...binderLine,
  ];

  return (
    <g ref={ref}>
      <SvgFlex direction="horizontal" align="middle" padding={10}>
        {finalChildren}
      </SvgFlex>
      <Indent x={32} y={64}>
        <Expression bind={props.definefunc} bindKey="body" />
      </Indent>
    </g>
  );
});
