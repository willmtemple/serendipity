import { observer } from 'mobx-react';
import * as React from 'react';

import { Arithmetic } from '@serendipity/syntax-surface/dist/expression';

import SvgFlex from '../../../components/layout/SvgFlex';
import Expression from '.';

const Arithmetic = React.forwardRef<any, { arithmetic: Arithmetic }>((props, ref) => (
    <SvgFlex ref={ref} direction="horizontal" align="middle" padding={20}>
        <Expression bind={props.arithmetic} bindKey="left" />
        <text>{props.arithmetic.op}</text>
        <Expression bind={props.arithmetic} bindKey="right" />
    </SvgFlex>
))

export default observer(Arithmetic);