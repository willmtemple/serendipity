import * as React from 'react';

export interface IndentProps {
    x?: number,
    y?: number
}

export const Indent = React.forwardRef<SVGGElement, React.PropsWithChildren<IndentProps>>((props, ref) => (
    <g ref={ref}>
        <g transform={`translate(${props.x || 0}, ${props.y || 0})`}>
            {props.children}
        </g>
    </g>
))

export default Indent;