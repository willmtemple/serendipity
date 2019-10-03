import { observer } from 'mobx-react';
import * as React from 'react';

import { global } from 'proto-syntax/dist/lib/lang/syntax/surface';
import Indent from 'components/layout/Indent';
import SvgFlex from 'components/layout/SvgFlex';
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
        <text key="s_dfn_label">define</text>,
        <Binder key="s_dfn_name" bind={props.definefunc} bindKey="name" />,
        <text key="s_dfn_open_paren">(</text>
    ];

    props.definefunc.parameters.forEach((p, idx) => {
        binderLine.push(<Binder key={`dfn_bind-${p}-${idx}`} bind={props.definefunc.parameters} bindKey={idx} />);
        if (idx < props.definefunc.parameters.length - 1) {
            binderLine.push(<text key={`s_dfn_comma_${idx}`}>,</text>);
        }
    });

    binderLine = binderLine.concat([
        <text key="s_dfn_close_paren">)</text>,
        <AddButton key="s_dfn_add_button"onClick={addParam} />,
        <text key="s_dfn_arrow">=></text>
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