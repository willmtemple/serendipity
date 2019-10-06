import * as React from 'react';

interface IIndentProps {
    x?: number,
    y?: number
}

const Indent = React.forwardRef<SVGGElement, React.PropsWithChildren<IIndentProps>>((props, ref) => (
    <g ref={ref}>
        <g transform={`translate(${props.x || 0}, ${props.y || 0})`}>
            {props.children}
        </g>
    </g>
))

export default Indent;