import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';

const CloseButton = React.forwardRef<SVGGElement, { onClick(): void }>((props, ref) => {
    useResizeParentEffect();

    return <g ref={ref} onClick={props.onClick} className="close button">
        <rect x={0} y={0} width={18} height={18} rx="2" fill="white" />
        <line x1={4} x2={14} y1={4} y2={14} stroke="black" strokeLinecap="round" strokeWidth={4} />
        <line x2={4} x1={14} y1={4} y2={14} stroke="black" strokeLinecap="round" strokeWidth={4} />
    </g>
})

export default CloseButton;