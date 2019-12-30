import { observer } from 'mobx-react';
import * as React from 'react';

import { If } from '@serendipity/syntax-surface/dist/expression';

import SvgFlex from '../../../components/layout/SvgFlex';
import Expression from '.';

const If = React.forwardRef<any, { _if: If }>((props, ref) => (
    <SvgFlex ref={ref} direction="vertical" padding={20}>
        <SvgFlex direction="horizontal" padding={20}>
            <text>if</text>
            <Expression bind={props._if} bindKey="cond" />
        </SvgFlex>
        <SvgFlex direction="horizontal" padding={20}>
            <text>? then</text>
            <Expression bind={props._if} bindKey="then" />
        </SvgFlex>
        <SvgFlex direction="horizontal" padding={20}>
            <text>: else</text>
            <Expression bind={props._if} bindKey="_else" />
        </SvgFlex>
    </SvgFlex>
))

export default observer(If);