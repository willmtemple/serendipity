import { observer } from 'mobx-react';
import * as React from 'react';

import { SyntaxObject } from '@serendipity/syntax/dist/lib/lang/syntax';

import { useResizeParentEffect } from 'hooks/measure';
import { useStores } from 'hooks/stores';

interface ISyntaxHoleProps {
    bind: SyntaxObject,
    bindKey: string | number,
    bindIdx?: number,

    kind: "expression" | "statement",
}

const RADIUS = 3;
const FORK_ARC_W = 5;
const FORK_ARC_CAP = 8;
const FORK_WIDTH = 14
const FORK_HALF_WIDTH = FORK_WIDTH / 2;
const FORK_HEIGHT = 12;
const FORK_OFFSET = 14;
const FORK_SIZE = (FORK_HALF_WIDTH * 2) + (FORK_OFFSET * 2)

function fork(x : number) {
    return FORK_HEIGHT / FORK_HALF_WIDTH * x;
}

const path : string = (() : string => {
    const r = {
        width: 120,
        height: 42 - FORK_HEIGHT
    }
    const span = r.width + (RADIUS * 2);
    const run = span - FORK_SIZE;
    
    const vrun = r.height - (RADIUS * 2) + FORK_HEIGHT;

    const forkUpTurn1ControlPointX = FORK_ARC_W / 2;
    const forkUpTurn1ControlPointY = 0
    const forkUpTurn1EndPointX = FORK_ARC_W;
    const forkUpTurn1EndPointY = fork(FORK_ARC_W/2);

    const forkUpTurn2StartPointX = (FORK_HALF_WIDTH - FORK_ARC_CAP/2 - FORK_ARC_W/2);
    const forkUpTurn2StartPointY = fork(FORK_HALF_WIDTH - FORK_ARC_CAP/2) - forkUpTurn1EndPointY;
    const forkUpTurn2ControlPointX = FORK_ARC_CAP / 2;
    const forkUpTurn2ControlPointY = FORK_HEIGHT - forkUpTurn2StartPointY;
    const forkUpTurn2EndPointX = FORK_ARC_CAP;
    const forkUpTurn2EndPointY = 0;

    const forkUpTurn3StartPointX = forkUpTurn2StartPointX;
    const forkUpTurn3StartPointY = -forkUpTurn2StartPointY;
    const forkUpTurn3ControlPointX = FORK_ARC_W/2;
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
})()

const StatementHole = React.forwardRef<SVGPathElement, ISyntaxHoleProps>((props, ref) => {
    const { ProjectStore } = useStores();

    useResizeParentEffect();

    return (
        <path ref={ref}
            className={"drop " + props.kind}
            data-parent-guid={ProjectStore.metadataFor(props.bind).guid}
            data-mutation-key={props.bindKey}
            data-mutation-idx={props.bindIdx}
            fill="#FFFFFFA0"
            d={path} />
    )
})

export default observer(StatementHole);