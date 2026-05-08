import * as React from "react";

import { MeasurementProps, measureChildren } from "../../hooks/measure";

const PADX = 12;
const PADY = 8;
const RADIUS = 5;
const TAB_WIDTH = 18;
const TAB_HEIGHT = 7;
const NOTCH_WIDTH = 24;
const NOTCH_DEPTH = 7;

export interface StatementBlockProps {
  color?: string;
  stroke?: string;
  transform?: string;
  containerProps?: any;
}

type CompleteProps = MeasurementProps & React.PropsWithChildren<StatementBlockProps>;

function path(width: number, height: number): string {
  const w = Math.max(width, 96);
  const h = Math.max(height, 32);
  return `
    M ${RADIUS} 0
    h ${NOTCH_WIDTH}
    v ${NOTCH_DEPTH}
    h ${TAB_WIDTH}
    v ${-NOTCH_DEPTH}
    h ${w - NOTCH_WIDTH - TAB_WIDTH - RADIUS * 2}
    q ${RADIUS} 0 ${RADIUS} ${RADIUS}
    v ${h - RADIUS * 2}
    q 0 ${RADIUS} ${-RADIUS} ${RADIUS}
    h ${-(w - NOTCH_WIDTH - TAB_WIDTH - RADIUS * 2)}
    v ${NOTCH_DEPTH}
    h ${-TAB_WIDTH}
    v ${-NOTCH_DEPTH}
    h ${-NOTCH_WIDTH}
    q ${-RADIUS} 0 ${-RADIUS} ${-RADIUS}
    v ${-(h - RADIUS * 2)}
    q 0 ${-RADIUS} ${RADIUS} ${-RADIUS}
    z
  `;
}

export const StatementBlock = measureChildren(
  React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    const size = props.sizes[0] ?? { width: 0, height: 0, x: 0, y: 0 };
    const width = size.width + PADX * 2;
    const height = size.height + PADY * 2 + TAB_HEIGHT;

    return (
      <g {...props.containerProps} transform={props.transform} ref={ref}>
        <path className="boundary" d={path(width, height)} />
        <g transform={`translate(${PADX},${PADY + TAB_HEIGHT})`}>{props.children}</g>
      </g>
    );
  })
);

StatementBlock.displayName = "StatementBlock";

export default StatementBlock;
