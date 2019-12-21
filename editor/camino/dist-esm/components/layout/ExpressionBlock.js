import * as React from 'react';
import Color from 'color';
import { measureChildren } from 'hooks/measure';
const PADX = 10;
const PADY = 10;
const RADIUS = 3;
const CAP_HEIGHT = 42;
const cx = [
    { cy1: 0, cx1: 0, cy2: 35, cx2: 15, ey: 37, ex: 5 },
    { cy1: 37, cx1: 5, cy2: 40, cx2: 0, ey: 38, ex: -5 },
    { cy1: 38, cx1: -5, cy2: 20, cx2: -20, ey: 50, ex: -20 },
    { cy1: 50, cx1: -20, cy2: 80, cx2: -20, ey: 62, ex: -5 },
    { cy1: 62, cx1: -5, cy2: 60, cx2: 0, ey: 63, ex: 5 },
    { cy1: 63, cx1: 5, cy2: 65, cx2: 15, ey: 100, ex: 0 },
];
const CAP_INDENT = (cx[0].cx2 / 100) * CAP_HEIGHT;
const CAP_EXTENT = -(cx[2].ex / 100) * CAP_HEIGHT;
const puzzlePiece = cx.map((section) => {
    const nextRow = { ...section };
    Object.keys(nextRow).forEach((k) => {
        if (nextRow.hasOwnProperty(k)) {
            nextRow[k] = (nextRow[k] / 100) * CAP_HEIGHT;
            if (k.substr(1, 1) === "y") {
                nextRow[k] = -nextRow[k] + CAP_HEIGHT + RADIUS;
            }
            else {
                nextRow[k] = nextRow[k] + CAP_EXTENT;
            }
        }
    });
    return nextRow;
})
    .map((r) => `C ${r.cx1} ${r.cy1}, ${r.cx2} ${r.cy2}, ${r.ex} ${r.ey}`)
    .join(' ');
function generatePath(r) {
    const hrun = r.width + (PADX * 2) - (RADIUS * 2) + CAP_INDENT;
    const vspan = r.height + (PADY * 2) - (RADIUS * 2);
    const vrun = (vspan < CAP_HEIGHT ? CAP_HEIGHT : vspan);
    return `
    M ${CAP_EXTENT} ${RADIUS}
    a ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} -${RADIUS}
    h ${hrun}
    a ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} ${RADIUS}
    v ${vrun}
    a ${RADIUS} ${RADIUS} 0 0 1 -${RADIUS} ${RADIUS}
    h -${hrun}
    a ${RADIUS} ${RADIUS} 0 0 1 -${RADIUS} -${RADIUS}
    l 0 ${CAP_HEIGHT - vrun}
    ${puzzlePiece}
    `;
}
const ExpressionBlock = measureChildren(React.forwardRef((props, ref) => {
    const pathDetails = React.useMemo(() => generatePath(props.sizes[0]), props.sizes);
    const color = Color(props.color);
    return (React.createElement("g", Object.assign({}, props.containerProps, { ref: ref }),
        React.createElement("path", { stroke: color.darken(0.35).string(), fill: color.string(), d: pathDetails }),
        React.createElement("g", { transform: `translate(${PADX + CAP_INDENT + CAP_EXTENT},${PADY})` }, props.children)));
}));
export default ExpressionBlock;
