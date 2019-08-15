import { observer } from 'mobx-react';
import * as React from 'react';

import { With } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import Binder from 'src/components/editor/Binder';
import Indent from 'src/components/layout/Indent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from './';

const With = React.forwardRef<any, { with: With }>((props, ref) => (
    <SvgFlex ref={ref} direction="vertical" padding={20}>
        <SvgFlex direction="horizontal" align="middle" padding={20} >
            <text>with</text>
            {/* Really don't change bindKey below to a number */}
            <Binder bind={props.with.binding} bindKey="0" />
            <text>=</text>
            <Expression bind={props.with} bindKey="binding" bindIdx={1} />
        </SvgFlex>
        <Indent x={32}>
            <Expression bind={props.with} bindKey="expr" />
        </Indent>
    </SvgFlex>
))

export default observer(With);