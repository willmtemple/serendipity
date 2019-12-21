import { observer } from 'mobx-react';
import * as React from 'react';

import { ForIn } from '@serendipity/syntax-surface/dist/statement';
import SvgFlex from 'components/layout/SvgFlex';
import Statement from '.';
import Binder from '../../editor/Binder';
import Indent from '../../layout/Indent';
import Expression from '../expression';

const ForIn = React.forwardRef<any, { forin: ForIn }>((props, ref) => (
    <SvgFlex ref={ref} direction="vertical" padding={20}>
        <SvgFlex direction="horizontal" padding={20}>
            <text>for</text>
            <Binder bind={props.forin} bindKey="binding" />
            <text>in</text>
            <Expression bind={props.forin} bindKey="value" />
        </SvgFlex>
        <Indent x={36}>
            <Statement bind={props.forin} bindKey="body" />
        </Indent>
    </SvgFlex>
))

export default observer(ForIn);