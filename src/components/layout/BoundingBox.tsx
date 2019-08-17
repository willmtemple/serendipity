import * as React from 'react';

import * as Color from 'color';

import { IMeasurementProps, measureChildren } from 'src/hooks/measure';

interface IBoundingBoxProps {
    color?: string,

    // Set extra props on the top-level g element
    containerProps?: any,
}

type CompleteProps = IMeasurementProps & React.PropsWithChildren<IBoundingBoxProps>;

const BoundingBox = measureChildren(React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {

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