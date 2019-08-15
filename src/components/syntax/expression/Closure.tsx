import { observer } from 'mobx-react';
import * as React from 'react';

import { Closure } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';
import AddButton from '../../editor/AddButton';
import Binder from '../../editor/Binder';
import Indent from '../../layout/Indent';

const Closure = React.forwardRef<any, { closure: Closure }>((props, ref) => {
    function addParam() {
        props.closure.parameters.push('new');
    }

    let binderLine = [
        <text>(</text>
    ]
    props.closure.parameters.forEach((p, idx) => {
        binderLine.push(<Binder bind={props.closure.parameters} bindKey={idx} />);
        if (idx < props.closure.parameters.length - 1) {
            binderLine.push(<text>,</text>);
        }
    });
    binderLine = binderLine.concat([
        <text>)</text>,
        <AddButton onClick={addParam} />,
        <text>=></text>
    ])

    return (
        <SvgFlex ref={ref} direction="vertical" padding={20}>
            <SvgFlex direction="horizontal" align="middle" padding={10}>
                {binderLine}
            </SvgFlex>
            <Indent x={36}>
                <Expression bind={props.closure} bindKey={"body"} />
            </Indent>
        </SvgFlex>
    );
})

export default observer(Closure);