import { observer } from 'mobx-react';
import * as React from 'react';

import { List } from '@serendipity/syntax-surface/dist/expression';

import Expression from '.';
import SvgFlex from '../../layout/SvgFlex';
import Indent from '../../layout/Indent';

const List = React.forwardRef<any, { list: List }>((props, ref) => (
    <SvgFlex ref={ref} direction="vertical" padding={10}>
        <text>[</text>
        <Indent x={32}>
            <SvgFlex direction="vertical" padding={10}>
                {props.list.contents.map((v, idx) =>
                    <Expression key={idx} bind={props.list} bindKey="contents" bindIdx={idx} />
                )}
            </SvgFlex>
        </Indent>
        <text>]</text>
    </SvgFlex>
))

export default observer(List);