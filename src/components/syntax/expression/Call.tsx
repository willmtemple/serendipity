import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';
import Indent from '../../layout/Indent';

interface ICallProps {
    parent? : ISizedComponent,
    
    call: expression.Call
}

@observer
class Call extends React.Component<ICallProps> {
    public render() {
        return (
            <SvgFlex direction="vertical" parent={this.props.parent} padding={10}>
                <SvgFlex direction="horizontal" align="end" padding={20}>
                    <Expression expression={this.props.call.callee} />
                    <text>(</text>
                </SvgFlex>
                <Indent x={36}>
                    <SvgFlex direction="vertical" padding={20}>
                        {this.props.call.parameters.map((p, idx) =>
                            <Expression key={idx} expression={p} />
                        )}
                    </SvgFlex>
                </Indent>
                <text>)</text>
            </SvgFlex>
        )
    }
}

export default Call;