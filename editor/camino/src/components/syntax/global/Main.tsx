import { observer } from 'mobx-react';
import * as React from 'react';

import { global } from '@serendipity/syntax/dist/lib/lang/syntax/surface';
import Indent from 'components/layout/Indent';
import CloseButton from '../../editor/CloseButton';
import Expression from '../expression';

interface IMainProps {
    main: global.Main
    onDelete(): void,
}

const Main = React.forwardRef<SVGGElement, IMainProps>((props, ref) => (
    <g ref={ref}>
        <CloseButton onClick={props.onDelete} />
        <Indent x={32} y={2}>
            <text>when the program starts, do</text>
        </Indent>
        <Indent x={32} y={32}>
            <Expression bind={props.main} bindKey="body" />
        </Indent>
    </g>
))

export default observer(Main);