import * as React from "react";

import { MeasurementProps, Rect, measureChildren } from "../../hooks/measure";

const PADX = 10;
const PADY = 10;
const RADIUS = 3;

const CAP_HEIGHT = 42;

const cx = [
  { cy1: 0, cx1: 0, cy2: 35, cx2: 15, ey: 37, ex: 5 }, // left shoulder
  { cy1: 37, cx1: 5, cy2: 40, cx2: 0, ey: 38, ex: -5 }, // left neck
  { cy1: 38, cx1: -5, cy2: 20, cx2: -20, ey: 50, ex: -20 }, // left head
  { cy1: 50, cx1: -20, cy2: 80, cx2: -20, ey: 62, ex: -5 }, // right head
  { cy1: 62, cx1: -5, cy2: 60, cx2: 0, ey: 63, ex: 5 }, // right neck
  { cy1: 63, cx1: 5, cy2: 65, cx2: 15, ey: 100, ex: 0 }, // right shoulder
];

const CAP_INDENT = (cx[0].cx2 / 100) * CAP_HEIGHT;
const CAP_EXTENT = -(cx[2].ex / 100) * CAP_HEIGHT;

const puzzlePiece = cx
  .map((section) => {
    const nextRow = { ...section };
    for (const key of Object.keys(nextRow)) {
      const k = key as keyof typeof nextRow;
      nextRow[k] = (nextRow[k] / 100) * CAP_HEIGHT;
      if (k.substr(1, 1) === "y") {
        nextRow[k] = -nextRow[k] + CAP_HEIGHT + RADIUS;
      } else {
        nextRow[k] = nextRow[k] + CAP_EXTENT;
      }
    }
    return nextRow;
  })
  .map((r) => `C ${r.cx1} ${r.cy1}, ${r.cx2} ${r.cy2}, ${r.ex} ${r.ey}`)
  .join(" ");

function generatePath(r: Rect): string {
  const hrun = r.width + PADX * 2 - RADIUS * 2 + CAP_INDENT;
  const vspan = r.height + PADY * 2 - RADIUS * 2;
  const vrun = vspan < CAP_HEIGHT ? CAP_HEIGHT : vspan;

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
}

export interface ExpressionBlockProps {
  color?: string;
  stroke?: string;

  transform?: string;

  // Set extra props on the top-level g element
  containerProps?: any;
}

type CompleteProps = MeasurementProps & React.PropsWithChildren<ExpressionBlockProps>;

export const ExpressionBlock = measureChildren(
  React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    const pathDetails = React.useMemo(() => generatePath(props.sizes[0]), props.sizes);

    return (
      <g {...props.containerProps} transform={props.transform} ref={ref}>
        <path className="boundary" d={pathDetails} />
        <g transform={`translate(${PADX + CAP_INDENT + CAP_EXTENT},${PADY})`}>{props.children}</g>
      </g>
    );
  })
);

export default ExpressionBlock;
