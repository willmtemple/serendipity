import * as React from "react";
import { useResizeParentEffect } from "../../hooks/measure";

const MinusButton = React.forwardRef<SVGGElement, { onClick(): void; transform?: string }>(
  (props, ref) => {
    useResizeParentEffect();

    return (
      <g ref={ref} onClick={props.onClick} className="add button" transform={props.transform}>
        <rect x={0} y={0} width={18} height={18} rx="2" fill="white" />
        <line x2={4} x1={14} y1={9} y2={9} stroke="black" strokeLinecap="round" strokeWidth={4} />
      </g>
    );
  }
);

export default MinusButton;
