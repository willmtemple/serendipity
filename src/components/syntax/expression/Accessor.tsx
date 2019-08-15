import { observer } from 'mobx-react';
import * as React from 'react';

import { Accessor } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';

const Accessor = React.forwardRef<any, { accessor: Accessor }>((props, ref) => (
    <SvgFlex ref={ref} direction="horizontal" align="end" padding={20}>
        <Expression bind={props.accessor} bindKey="accessee" />
        <text>.</text>
        <Expression bind={props.accessor} bindKey="index" />
    </SvgFlex>
))

export default observer(Accessor);