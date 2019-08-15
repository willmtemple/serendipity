import { observer } from 'mobx-react';
import * as React from 'react';

import { global } from 'proto-syntax/dist/lib/lang/syntax/surface';
import Indent from 'src/components/layout/Indent';
import SvgFlex from 'src/components/layout/SvgFlex';
import AddButton from '../../editor/AddButton';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Expression from '../expression';

interface IDefineFuncProps {
    definefunc: global.DefineFunction,

    onDelete(): void
}

const DefineFunc = React.forwardRef<SVGGElement, IDefineFuncProps>((props, ref) => {

    function addParam() {
        props.definefunc.parameters.push('new');
    }

    let binderLine = [
        <text>define</text>,
        <Binder bind={props.definefunc} bindKey="name" />,
        <text>(</text>
    ];

    props.definefunc.parameters.forEach((_, idx) => {
        binderLine.push(<Binder bind={props.definefunc.parameters} bindKey={idx} />);
        if (idx < props.definefunc.parameters.length - 1) {
            binderLine.push(<text>,</text>);
        }
    });

    binderLine = binderLine.concat([
        <text>)</text>,
        <AddButton onClick={addParam} />,
        <text>=></text>
    ])

    return (
        <g ref={ref}>
            <CloseButton onClick={props.onDelete} />
            <Indent x={32}>
                <SvgFlex direction="horizontal" align="middle" padding={10}>
                    {binderLine}
                </SvgFlex>
            </Indent>
            <Indent x={32} y={64}>
                <Expression bind={props.definefunc} bindKey="body" />
            </Indent>
        </g>
    );
})

export default observer(DefineFunc);