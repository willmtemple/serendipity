import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';

interface IIfProps {
    parent? : ISizedComponent,

    _if : expression.If
}

@observer
class If extends React.Component<IIfProps> {
    public render() {
        return (
            <SvgFlex direction="vertical" parent={this.props.parent} padding={20}>
                <SvgFlex direction="horizontal" padding={20}>
                    <text>if</text>
                    <Expression parent={this.props.parent} bind={this.props._if} bindKey={"cond"} />
                </SvgFlex>
                <SvgFlex direction="horizontal" padding={20}>
                    <text>? then</text>
                    <Expression parent={this.props.parent} bind={this.props._if} bindKey={"then"} />
                </SvgFlex>
                <SvgFlex direction="horizontal" padding={20}>
                    <text>: else</text>
                    <Expression parent={this.props.parent} bind={this.props._if} bindKey={"_else"} />
                </SvgFlex>
            </SvgFlex>
        )
    }
}

export default If;