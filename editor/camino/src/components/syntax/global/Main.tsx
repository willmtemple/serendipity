import Indent from "../../layout/Indent";
import CloseButton from "../../editor/CloseButton";
import Expression from "../expression";
import { syntax } from "../../../util/syntaxComponent";
import { Main } from "@serendipity/syntax-surface";

interface MainProps {
  main: Main;
  onDelete(): void;
}

export default syntax<MainProps>("Main", (props, ref) => (
  <g ref={ref}>
    <CloseButton onClick={props.onDelete} />
    <Indent x={32} y={2}>
      <text>when the program starts</text>
    </Indent>
    <Indent x={32} y={32}>
      <Expression bind={props.main} bindKey="body" />
    </Indent>
  </g>
));
