import * as React from 'react';

import { IMeasurementProps, measureChildren } from 'src/hooks/measure';

interface IBoundingBoxProps {
    color?: string,
    padding?: number,
    rx?: number,
    ry?: number,
    stroke?: string,
    strokeWidth?: number,

    // Set extra props on the top-level g element
    containerProps?: any,
}

type CompleteProps = IMeasurementProps & React.PropsWithChildren<IBoundingBoxProps>;

const BoundingBox = measureChildren(React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    const pad = props.padding || 0;

    return (
        <g {...props.containerProps} ref={ref}>
            <rect fill={props.color || "black"}
                rx={props.rx || 6}
                ry={props.ry}
                stroke={props.stroke}
                strokeWidth={props.strokeWidth}
                width={props.sizes[0].width + (pad * 2)}
                height={props.sizes[0].height + (pad * 2)} />
            <g transform={pad ? `translate(${pad},${pad})` : undefined}>
                {props.children}
            </g>
        </g>
    );
}));

export default BoundingBox;