import * as React from "react";

export interface IndentProps {
  x?: number;
  y?: number;
  transform?: string;
}

export const Indent = React.forwardRef<SVGGElement, React.PropsWithChildren<IndentProps>>(
  (props, ref) => (
    <g ref={ref} transform={props.transform}>
      <g transform={`translate(${props.x || 0}, ${props.y || 0})`}>{props.children}</g>
    </g>
  )
);

export default Indent;
