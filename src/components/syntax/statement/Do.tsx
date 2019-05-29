import { observer } from 'mobx-react';
import * as React from 'react';

import { statement } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import Expression from '../expression';

interface IDoProps {
    parent? : ISizedComponent,

    do : statement.Do
}

@observer
class Do extends React.Component<IDoProps> {
    public render() {
        return (
            <g>
                <text>do</text>
                <g transform="translate(32, 0)">
                    <Expression parent={this.props.parent} bind={this.props.do} bindKey="body" />
                </g>
            </g >
        );
    }
}

export default Do;