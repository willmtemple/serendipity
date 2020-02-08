import { observer } from "mobx-react";
import * as React from "react";

import { SyntaxObject } from "@serendipity/syntax";

import { useResizeParentEffect } from "../../hooks/measure";
import { useStores } from "../../hooks/stores";

interface ISyntaxHoleProps {
  bind: SyntaxObject;
  bindKey: string | number;
  bindIdx?: number;

  kind: "expression" | "statement";
}

const RADIUS = 3;

const CAP_HEIGHT = 42;

const cx = [
  { cy1: 0, cx1: 0, cy2: 35, cx2: 15, ey: 37, ex: 5 }, // left shoulder
  { cy1: 37, cx1: 5, cy2: 40, cx2: 0, ey: 38, ex: -5 }, // left neck
  { cy1: 38, cx1: -5, cy2: 20, cx2: -20, ey: 50, ex: -20 }, // left head
  { cy1: 50, cx1: -20, cy2: 80, cx2: -20, ey: 62, ex: -5 }, // right head
  { cy1: 62, cx1: -5, cy2: 60, cx2: 0, ey: 63, ex: 5 }, // right neck
  { cy1: 63, cx1: 5, cy2: 65, cx2: 15, ey: 100, ex: 0 } // right shoulder
];

const CAP_INDENT = (cx[0].cx2 / 100) * CAP_HEIGHT;
const CAP_EXTENT = -(cx[2].ex / 100) * CAP_HEIGHT;

const puzzlePiece = cx
  .map((section) => {
    const nextRow = { ...section };
    Object.keys(nextRow).forEach((k) => {
      if (nextRow.hasOwnProperty(k)) {
        nextRow[k] = (nextRow[k] / 100) * CAP_HEIGHT;
        if (k.substr(1, 1) === "y") {
          nextRow[k] = -nextRow[k] + CAP_HEIGHT + RADIUS;
        } else {
          nextRow[k] = nextRow[k] + CAP_EXTENT;
        }
      }
    });
    return nextRow;
  })
  .map((r) => `C ${r.cx1} ${r.cy1}, ${r.cx2} ${r.cy2}, ${r.ex} ${r.ey}`)
  .join(" ");

const path: string = (() => {
  const r = {
    width: 87,
    height: 42 + RADIUS * 2
  };
  const hrun = r.width - RADIUS * 2 + CAP_INDENT;
  const vrun = r.height - RADIUS * 2;

  return `
    M ${CAP_EXTENT} ${RADIUS}
    a ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} -${RADIUS}
    h ${hrun}
    a ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} ${RADIUS}
    v ${vrun}
    a ${RADIUS} ${RADIUS} 0 0 1 -${RADIUS} ${RADIUS}
    h -${hrun}
    a ${RADIUS} ${RADIUS} 0 0 1 -${RADIUS} -${RADIUS}
    l 0 ${CAP_HEIGHT - vrun}
    ${puzzlePiece}
    `;
})();

const ExpressionHole = React.forwardRef<SVGPathElement, ISyntaxHoleProps>((props, ref) => {
  const { ProjectStore } = useStores();

  useResizeParentEffect();

  return (
    <path
      ref={ref}
      className={"drop " + props.kind}
      data-parent-guid={ProjectStore.metadataFor(props.bind).guid}
      data-mutation-key={props.bindKey}
      data-mutation-idx={props.bindIdx}
      fill="#FFFFFFA0"
      stroke="#000000"
      strokeWidth={2}
      strokeDasharray="6 4"
      d={path}
    />
  );
});

export default observer(ExpressionHole);
