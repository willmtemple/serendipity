import { observer } from 'mobx-react';
import * as React from 'react';

import { Do } from 'proto-syntax/dist/lib/lang/syntax/surface/statement';
import Indent from 'src/components/layout/Indent';
import Expression from '../expression';

const Do = React.forwardRef<SVGGElement, { do: Do }>((props, ref) => (
    <g ref={ref}>
        <text>do</text>
        <Indent x={32}>
            <Expression bind={props.do} bindKey="body" />
        </Indent>
    </g>
))

export default observer(Do);