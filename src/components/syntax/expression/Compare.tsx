import { observer } from 'mobx-react';
import * as React from 'react'

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';

interface ICompareProps {
    parent? : ISizedComponent

    compare: expression.Compare
}

@observer
class Compare extends React.Component<ICompareProps> {
    public render() {
        return (
            <SvgFlex direction="horizontal" align="middle" parent={this.props.parent} padding={20}>
                <Expression bind={this.props.compare} bindKey={"left"} />
                <text>{this.props.compare.op}</text>
                <Expression bind={this.props.compare} bindKey={"right"} />
            </SvgFlex>
        )
    }
}

export default Compare;