import { observer } from "mobx-react";
import * as React from "react";

import { useStores } from "@serendipity/editor-stores";

import { useResizeParentEffect } from "../../hooks/measure";
import { useInteractionState } from "../../interaction";

interface SyntaxHoleProps {
  bind: object;
  bindKey: string | number;
  bindIdx?: number | undefined;

  transform?: string | undefined;

  kind: "expression" | "statement";
}

const ExpressionHole = React.forwardRef<SVGRectElement, SyntaxHoleProps>((props, ref) => {
  const { Project } = useStores();
  const interaction = useInteractionState();

  useResizeParentEffect();
  const parentGuid = Project.metadataFor(props.bind).guid;
  const isSnapTarget =
    interaction.snapTarget?.kind === props.kind &&
    interaction.snapTarget.parentGuid === parentGuid &&
    interaction.snapTarget.key === String(props.bindKey) &&
    interaction.snapTarget.idx === props.bindIdx;

  return (
    <rect
      ref={ref}
      transform={props.transform}
      className={"drop " + props.kind + (isSnapTarget ? " snap-target" : "")}
      data-bind={props.bind}
      data-bind-key={props.bindKey}
      data-parent-guid={parentGuid}
      data-mutation-key={props.bindKey}
      data-mutation-idx={props.bindIdx}
      fill="#FFFFFFA0"
      stroke="#000000"
      strokeWidth={2}
      strokeDasharray="6 4"
      x={0}
      y={0}
      width={92}
      height={36}
      rx={7}
    />
  );
});

export default observer(ExpressionHole);
