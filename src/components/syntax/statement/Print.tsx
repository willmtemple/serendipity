import { observer } from 'mobx-react';
import { statement } from 'proto-syntax/dist/lib/lang/syntax/surface';
import * as React from 'react';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import Expression from '../expression';

interface IPrintProps {
    parent? : ISizedComponent,

    print : statement.Print
}

@observer
class Print extends React.Component<IPrintProps> {
    public render() {
        return (
            <g>
                <text>print</text>
                <g transform="translate(64, 0)">
                    <Expression parent={this.props.parent} bind={this.props.print} bindKey="value" />
                </g>
            </g >
        );
    }
}

export default Print;