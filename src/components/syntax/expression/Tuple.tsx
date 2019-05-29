import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';
import Indent from '../../layout/Indent';

interface ITupleProps {
    parent? : ISizedComponent,

    tuple : expression.Tuple
}

@observer
class Tuple extends React.Component<ITupleProps> {
    public render() {
        console.log("Tuple is rendering")
        return (
            <SvgFlex direction="vertical" parent={this.props.parent} padding={10}>
                <text>(</text>
                <Indent x={36}>
                    <SvgFlex direction="vertical" padding={20}>
                        {this.props.tuple.values.map((_, idx) =>
                            <Expression key={idx} bind={this.props.tuple} bindKey="values" bindIdx={idx} />
                        )}
                    </SvgFlex>
                </Indent>
                <text>)</text>
            </SvgFlex>
        )
    }
}

export default Tuple;