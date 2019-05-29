import { observer } from 'mobx-react';
import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import * as React from 'react'
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';

interface IArithmeticProps {
    parent? : ISizedComponent,

    arithmetic: expression.Arithmetic
}

@observer
class Arithmetic extends React.Component<IArithmeticProps> {
    public render() {
        console.log("Arithmetic is rendering")
        return (
            <SvgFlex direction="horizontal" align="middle" parent={this.props.parent} padding={20}>
                <Expression expression={this.props.arithmetic.left} />
                <text>{this.props.arithmetic.op}</text>
                <Expression expression={this.props.arithmetic.right} />
            </SvgFlex>
        )
    }
}

export default Arithmetic;