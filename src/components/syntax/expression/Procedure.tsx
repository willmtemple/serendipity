import { observer } from 'mobx-react';
import * as React from 'react';

import { Procedure } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import Indent from 'src/components/layout/Indent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Statement from '../statement';

const Procedure = React.forwardRef<any, { procedure: Procedure }>((props, ref) => (
    <SvgFlex ref={ref} direction="vertical" padding={32}>
        <text>{"<proc>"} [</text>
        <Indent x={32}>
            <SvgFlex direction="vertical" padding={5}>
                {props.procedure.body.map((_, idx) =>
                    <Statement bind={props.procedure} bindKey="body" bindIdx={idx} />
                )}
            </SvgFlex>
        </Indent>
        <text>]</text>
    </SvgFlex>
))

export default observer(Procedure);