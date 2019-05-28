import { observer } from 'mobx-react';
import * as React from 'react';

import { global } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Indent from '../../layout/Indent';
import Expression from '../expression';

interface IDefineProps {
    parent? : ISizedComponent

    define: global.Define,

    onDelete() : void,
}

@observer
class Define extends React.Component<IDefineProps> {
    public render() {
        return (
            <g>
                <CloseButton onClick={this.props.onDelete} />
                <text x={30} fontWeight={900}>define</text>
                <g transform="translate(100, 0)">
                    <Binder bind={this.props.define} bindKey="name" />
                </g>
                <Indent parent={this.props.parent} x={36} y={48}>
                    <Expression expression={this.props.define.value} />
                </Indent>
            </g>
        );
    }
}

export default Define;