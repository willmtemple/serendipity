import { observer } from 'mobx-react';
import * as React from 'react';

import { Call } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
import Indent from '../../layout/Indent';

const Call = React.forwardRef<any, { call: Call }>((props, ref) => {
    return (
        <SvgFlex ref={ref} direction="vertical" padding={10}>
            <SvgFlex direction="horizontal" align="end" padding={20}>
                <Expression bind={props.call} bindKey={"callee"} />
                <text>(</text>
            </SvgFlex>
            <Indent x={36}>
                <SvgFlex direction="vertical" padding={20}>
                    {props.call.parameters.map((_, idx) =>
                        <Expression key={idx} bind={props.call} bindKey={"parameters"} bindIdx={idx} />
                    )}
                </SvgFlex>
            </Indent>
            <text>)</text>
        </SvgFlex>
    )
})

export default observer(Call);