import * as React from 'react';
import Color from 'color';
import { measureChildren } from 'hooks/measure';
const BoundingBox = measureChildren(React.forwardRef((props, ref) => {
    const color = Color(props.color);
    return (React.createElement("g", Object.assign({}, props.containerProps, { ref: ref }),
        React.createElement("rect", { fill: color.string(), rx: 5, stroke: color.darken(0.5).string(), strokeWidth: 1.5, width: props.sizes[0].width + 20, height: props.sizes[0].height + 20 }),
        React.createElement("g", { transform: "translate(10,10)" }, props.children)));
}));
export default BoundingBox;
