import { observer } from 'mobx-react';
import * as React from 'react';

import * as global from '@serendipity/syntax-surface/dist/global';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Indent from '../../layout/Indent';
import Expression from '../expression';

interface IDefineProps {
    define: global.Define,

    onDelete(): void,
}

const Define = React.forwardRef<SVGGElement, IDefineProps>((props, ref) => (
    <g ref={ref}>
        <CloseButton onClick={props.onDelete} />
        <Indent x={32} y={8}>
            <text>define</text>
        </Indent>
        <Indent x={96}>
            <Binder bind={props.define} bindKey="name" />
        </Indent>
        <Indent x={36} y={48}>
            <Expression bind={props.define} bindKey="value" />
        </Indent>
    </g>
))

export default observer(Define);