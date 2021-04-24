import * as React from "react";

import { useResizeParentEffect } from "../../hooks/measure";

const BUTTON_WIDTH = 24;
const BUTTON_RADIUS = 4;

const CloseButton = React.forwardRef<SVGGElement, { onClick(): void; transform?: string }>(
  (props, ref) => {
    useResizeParentEffect();

    return (
      <g
        ref={ref}
        onClick={props.onClick}
        className="inline close button"
        transform={props.transform}
      >
        <rect x={0} y={0} width={BUTTON_WIDTH} height={BUTTON_WIDTH} rx={BUTTON_RADIUS} />
        <line x1={5} x2={19} y1={5} y2={19} />
        <line x2={5} x1={19} y1={5} y2={19} />
      </g>
    );
  }
);

export default CloseButton;
