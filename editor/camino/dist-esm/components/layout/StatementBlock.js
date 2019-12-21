import * as React from 'react';
import Color from 'color';
import { measureChildren } from 'hooks/measure';
const PADX = 10;
const PADY_TOP = 2;
const PADY_BOT = 8;
const PADY_TOTAL = PADY_BOT + PADY_TOP;
const RADIUS = 3;
const FORK_ARC_W = 5;
const FORK_ARC_CAP = 8;
const FORK_WIDTH = 14;
const FORK_HALF_WIDTH = FORK_WIDTH / 2;
const FORK_HEIGHT = 12;
const FORK_OFFSET = 14;
const FORK_SIZE = (FORK_HALF_WIDTH * 2) + (FORK_OFFSET * 2);
const MIN_WIDTH = FORK_SIZE + (PADX - RADIUS) * 2;
function fork(x) {
    return FORK_HEIGHT / FORK_HALF_WIDTH * x;
}
function generatePath(r) {
    const span = r.width + ((PADX - RADIUS) * 2);
    const run = (span < MIN_WIDTH ? MIN_WIDTH : span - FORK_SIZE);
    const vrun = r.height - (RADIUS * 2) + FORK_HEIGHT + (PADY_TOTAL);
    const forkUpTurn1ControlPointX = FORK_ARC_W / 2;
    const forkUpTurn1ControlPointY = 0;
    const forkUpTurn1EndPointX = FORK_ARC_W;
    const forkUpTurn1EndPointY = fork(FORK_ARC_W / 2);
    const forkUpTurn2StartPointX = (FORK_HALF_WIDTH - FORK_ARC_CAP / 2 - FORK_ARC_W / 2);
    const forkUpTurn2StartPointY = fork(FORK_HALF_WIDTH - FORK_ARC_CAP / 2) - forkUpTurn1EndPointY;
    const forkUpTurn2ControlPointX = FORK_ARC_CAP / 2;
    const forkUpTurn2ControlPointY = FORK_HEIGHT - forkUpTurn2StartPointY;
    const forkUpTurn2EndPointX = FORK_ARC_CAP;
    const forkUpTurn2EndPointY = 0;
    const forkUpTurn3StartPointX = forkUpTurn2StartPointX;
    const forkUpTurn3StartPointY = -forkUpTurn2StartPointY;
    const forkUpTurn3ControlPointX = FORK_ARC_W / 2;
    const forkUpTurn3ControlPointY = -forkUpTurn1EndPointY;
    const forkUpTurn3EndPointX = FORK_ARC_W;
    const forkUpTurn3EndPointY = -forkUpTurn1EndPointY;
    return `
    M 0 ${RADIUS}
    a ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} -${RADIUS}
    h ${FORK_OFFSET - FORK_ARC_W / 2}
    q ${forkUpTurn1ControlPointX} ${forkUpTurn1ControlPointY} ${forkUpTurn1EndPointX} ${forkUpTurn1EndPointY}
    l ${forkUpTurn2StartPointX} ${forkUpTurn2StartPointY}
    q ${forkUpTurn2ControlPointX} ${forkUpTurn2ControlPointY} ${forkUpTurn2EndPointX} ${forkUpTurn2EndPointY}
    l ${forkUpTurn3StartPointX} ${forkUpTurn3StartPointY}
    q ${forkUpTurn3ControlPointX} ${forkUpTurn3ControlPointY} ${forkUpTurn3EndPointX} ${forkUpTurn3EndPointY}
    h ${FORK_OFFSET - FORK_ARC_W / 2}
    h ${run}
    a ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} ${RADIUS}
    v ${vrun}
    a ${RADIUS} ${RADIUS} 0 0 1 -${RADIUS} ${RADIUS}
    h -${run}
    h -${FORK_OFFSET - FORK_ARC_W / 2}
    q ${-forkUpTurn1ControlPointX} ${forkUpTurn1ControlPointY} ${-forkUpTurn1EndPointX} ${forkUpTurn1EndPointY}
    l ${-forkUpTurn2StartPointX} ${forkUpTurn2StartPointY}
    q ${-forkUpTurn2ControlPointX} ${forkUpTurn2ControlPointY} ${-forkUpTurn2EndPointX} ${forkUpTurn2EndPointY}
    l ${-forkUpTurn3StartPointX} ${forkUpTurn3StartPointY}
    q ${-forkUpTurn3ControlPointX} ${forkUpTurn3ControlPointY} ${-forkUpTurn3EndPointX} ${forkUpTurn3EndPointY}
    h -${FORK_OFFSET - FORK_ARC_W / 2}
    a ${RADIUS} ${RADIUS} 0 0 1 -${RADIUS} -${RADIUS}
    z
    `;
}
const StatementBlock = measureChildren(React.forwardRef((props, ref) => {
    const pathDetails = React.useMemo(() => generatePath(props.sizes[0]), props.sizes);
    const color = Color(props.color);
    return (React.createElement("g", Object.assign({}, props.containerProps, { ref: ref }),
        React.createElement("path", { stroke: color.darken(0.35).string(), strokeWidth: 1.5, fill: color.string(), d: pathDetails }),
        React.createElement("g", { transform: `translate(${PADX},${FORK_HEIGHT + PADY_TOP})` }, props.children)));
}));
export default StatementBlock;
