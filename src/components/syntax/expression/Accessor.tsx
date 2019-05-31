import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';

interface IAccessorProps {
    parent?: ISizedComponent

    accessor: expression.Accessor
}

@observer
class Accessor extends React.Component<IAccessorProps> {
    public render() {
        return (
            <SvgFlex direction="horizontal" align="end" parent={this.props.parent} padding={20}>
                <Expression bind={this.props.accessor} bindKey={"accessee"} />
                <text>.</text>
                <Expression bind={this.props.accessor} bindKey={"index"} />
            </SvgFlex>
        )
    }
}

export default Accessor;