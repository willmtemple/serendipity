import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';
const CloseButton = React.forwardRef((props, ref) => {
    useResizeParentEffect();
    return React.createElement("g", { ref: ref, onClick: props.onClick, className: "close button" },
        React.createElement("rect", { x: 0, y: 0, width: 18, height: 18, rx: "2", fill: "white" }),
        React.createElement("line", { x1: 4, x2: 14, y1: 4, y2: 14, stroke: "black", strokeLinecap: "round", strokeWidth: 4 }),
        React.createElement("line", { x2: 4, x1: 14, y1: 4, y2: 14, stroke: "black", strokeLinecap: "round", strokeWidth: 4 }));
});
export default CloseButton;
