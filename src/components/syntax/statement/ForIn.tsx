import { observer } from 'mobx-react';
import * as React from 'react';

import { statement } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Statement from '.';
import Binder from '../../editor/Binder';
import Indent from '../../layout/Indent';
import Expression from '../expression';

interface IForInProps {
    parent? : ISizedComponent,

    forin : statement.ForIn
}

@observer
class ForIn extends React.Component<IForInProps> {
    public render() {
        return (
            <SvgFlex direction="vertical" parent={this.props.parent} padding={20}>
                <SvgFlex direction="horizontal" padding={20}>
                    <text>for</text>
                    <Binder bind={this.props.forin} bindKey="binding" />
                    <text>in</text>
                    <Expression bind={this.props.forin} bindKey="value" />
                </SvgFlex>
                <Indent x={36}>
                    <Statement bind={this.props.forin} bindKey="body" />
                </Indent>
            </SvgFlex>
        );
    }
}

export default ForIn;