import { observer } from 'mobx-react';
import * as React from 'react'

import { Compare } from '@serendipity/syntax-surface/dist/expression';

import SvgFlex from '../../../components/layout/SvgFlex';
import Expression from '.';

const Compare = React.forwardRef<any, { compare: Compare }>((props, ref) => (
    <SvgFlex ref={ref} direction="horizontal" align="middle" padding={20}>
        <Expression bind={props.compare} bindKey={"left"} />
        <text>{props.compare.op}</text>
        <Expression bind={props.compare} bindKey={"right"} />
    </SvgFlex>
))

export default observer(Compare);