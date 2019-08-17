import { observer } from 'mobx-react';
import * as React from 'react';

import { Print } from 'proto-syntax/dist/lib/lang/syntax/surface/statement';
import Indent from 'src/components/layout/Indent';
import Expression from '../expression';


const Print = React.forwardRef<SVGGElement, { print: Print }>((props, ref) => (
    <g ref={ref}>
        <Indent y={18}>
            <text>print</text>
        </Indent>
        <Indent x={60}>
            <Expression bind={props.print} bindKey="value" />
        </Indent>
    </g>
))

export default observer(Print);