import { Call, Expression as SurfaceExpression } from "@serendipity/syntax-surface";

import SvgFlex from "../../../components/layout/SvgFlex";
import Expression from ".";
import Indent from "../../layout/Indent";
import { syntax } from "../../../util/syntaxComponent";
import { observable } from "mobx";
import AddButton from "../../editor/AddButton";
import { Project } from "@serendipity/editor-stores";
import MinusButton from "../../editor/MinusButton";
import { useResizeParent } from "../../../hooks/measure";
import { Reflow } from "../../layout";

export default syntax<{ call: Call }>("Call", (props, ref) => {
  const resize = useResizeParent();
  function addParam() {
    const e: SurfaceExpression = {
      kind: "@hole",
    };

    Project.loadGUID(e as any);

    props.call.parameters.push(observable(e));
  }

  function removeParam(idx: number) {
    props.call.parameters.splice(idx, 1);
    resize();
  }

  const reflowChildren = [
    <g>
      <SvgFlex direction={"horizontal"} align="middle" padding={20}>
        <Expression bind={props.call} bindKey={"callee"} />
        <text>(</text>
      </SvgFlex>
    </g>,
    ...props.call.parameters.map((_, idx) => (
      <g>
        <SvgFlex key={idx} direction="horizontal" padding={10} align="middle">
          <MinusButton onClick={() => removeParam(idx)} />
          <Expression bind={props.call} bindKey={"parameters"} bindIdx={idx} />
          {idx + 1 === props.call.parameters.length ? <text></text> : <text>,</text>}
        </SvgFlex>
      </g>
    )),
    <g>
      <SvgFlex direction="horizontal" align="middle" padding={10}>
        <text>)</text>
        <AddButton key="call_add_button" onClick={addParam} />
      </SvgFlex>
    </g>,
  ];

  return <Reflow ref={ref} break={700} children={reflowChildren}></Reflow>;

  return (
    <SvgFlex ref={ref} direction="vertical" padding={10}>
      <SvgFlex direction="horizontal" align="end" padding={20}>
        <Expression bind={props.call} bindKey={"callee"} />
        <text>(</text>
      </SvgFlex>
      <Indent x={36}>
        <SvgFlex direction="vertical" padding={20}>
          {props.call.parameters.map((_, idx) => (
            <SvgFlex key={idx} direction="horizontal" padding={10} align="middle">
              <MinusButton onClick={() => removeParam(idx)} />
              <Expression bind={props.call} bindKey={"parameters"} bindIdx={idx} />
            </SvgFlex>
          ))}
        </SvgFlex>
      </Indent>
      <SvgFlex direction="horizontal" align="middle" padding={10}>
        <text>)</text>
        <AddButton key="call_add_button" onClick={addParam} />
      </SvgFlex>
    </SvgFlex>
  );
});

/**/
