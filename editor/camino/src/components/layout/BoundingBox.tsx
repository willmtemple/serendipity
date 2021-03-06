import * as React from 'react';

import Color from 'color';

import { MeasurementProps, measureChildren } from '../../hooks/measure';

export interface BoundingBoxProps {
    color?: string,

    // Set extra props on the top-level g element
    containerProps?: any,
}

type CompleteProps = MeasurementProps & React.PropsWithChildren<BoundingBoxProps>;

export const BoundingBox = measureChildren(React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {

    const color = Color(props.color);

    return (
        <g {...props.containerProps} ref={ref}>
            <rect fill={color.string()}
                rx={5}
                stroke={color.darken(0.5).string()}
                strokeWidth={1.5}
                width={props.sizes[0].width + 20}
                height={props.sizes[0].height + 20} />
            <g transform="translate(10,10)">
                {props.children}
            </g>
        </g>
    );
}));

export default BoundingBox;