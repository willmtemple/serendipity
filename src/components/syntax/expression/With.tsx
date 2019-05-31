import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import Binder from 'src/components/editor/Binder';
import Indent from 'src/components/layout/Indent';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from './';

interface IWithProps {
    parent? : ISizedComponent

    with: expression.With
}

@observer
export default class With extends React.Component<IWithProps> {
    public render() {
        return (
            <SvgFlex parent={this.props.parent} direction="vertical" padding={20}>
                <SvgFlex direction="horizontal" align="middle" padding={20} >
                    <text>with</text>
                    <Binder bind={this.props.with.binding} bindKey={0} />
                    <text>=</text>
                    <Expression bind={this.props.with} bindKey="binding" bindIdx={1} />
                </SvgFlex>
                <Indent x={36}>
                    <Expression bind={this.props.with} bindKey="expr" />
                </Indent>
            </SvgFlex>
        );
    }
}