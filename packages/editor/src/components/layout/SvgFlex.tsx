import * as React from 'react';

import { IMeasurementProps, IRect, measureChildren } from 'hooks/measure';


interface ISvgFlexProps {
    align?: "beginning" | "middle" | "end"
    direction: "horizontal" | "vertical",
    padding?: number,
}

type CompleteProps = IMeasurementProps & React.PropsWithChildren<ISvgFlexProps>;

const SvgFlex = measureChildren(React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    // Compute size along orthogonal axis
    const oSel: (r: IRect) => number =
        props.direction === "horizontal"
            ? r => r.height
            : r => r.width;

    const oDim = props.sizes.reduce((max, rect) => {
        const n = oSel(rect);
        return n > max ? n : max;
    }, 0);

    // Alignment helper function
    const align: (rect: IRect) => number =
        props.align === "end"
            ? r => oDim - oSel(r)
            : (
                props.align === "middle"
                    ? r => (oDim - oSel(r)) / 2
                    : r => 0
            );

    const pad = props.padding || 0;

    return (
        <g className="flex" ref={ref}>
            {
                (() => {
                    let accumulator = 0;
                    return React.Children.map(props.children, (c, idx) => {
                        let translation;
                        const rect = props.sizes[idx];
                        if (props.direction === "horizontal") {
                            translation = `translate(${accumulator},${align(rect)})`
                            accumulator += rect.width + pad;
                        } else { // "vertical"
                            translation = `translate(${align(rect)},${accumulator})`
                            accumulator += rect.height + pad;
                        }
                        return React.cloneElement(c as JSX.Element, {
                            transform: translation
                        });
                    })
                })()
            }
        </g>
    );
}))

export default SvgFlex;