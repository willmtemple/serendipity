import * as React from "react";

import { MeasurementProps, measureChildren } from "../../hooks/measure";

const PADX = 14;
const PADY = 9;
const RADIUS = 6;

export interface ExpressionBlockProps {
  color?: string | undefined;
  stroke?: string | undefined;
  transform?: string | undefined;
  containerProps?: any;
}

type CompleteProps = MeasurementProps & React.PropsWithChildren<ExpressionBlockProps>;

export const ExpressionBlock = measureChildren(
  React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    const size = props.sizes[0] ?? { width: 0, height: 0, x: 0, y: 0 };
    const width = Math.max(size.width + PADX * 2, 34);
    const height = Math.max(size.height + PADY * 2, 28);

    return (
      <g {...props.containerProps} transform={props.transform} ref={ref}>
        <rect className="boundary" rx={RADIUS} width={width} height={height} />
        <g transform={`translate(${PADX},${PADY})`}>{props.children}</g>
      </g>
    );
  })
);

ExpressionBlock.displayName = "ExpressionBlock";

export default ExpressionBlock;
