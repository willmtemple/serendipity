import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';
import Indent from '../../layout/Indent';

interface IListProps {
    parent? : ISizedComponent,

    list: expression.List
}

@observer
class List extends React.Component<IListProps> {
    public render() {
        console.log("List is rendering")
        return (
            <SvgFlex direction="vertical" parent={this.props.parent} padding={10}>
                <text>[</text>
                <Indent x={36}>
                    <SvgFlex direction="vertical" padding={10}>
                        {this.props.list.contents.map((v, idx) =>
                            <Expression key={idx} expression={v} />
                        )}
                    </SvgFlex>
                </Indent>
                <text>]</text>
            </SvgFlex>
        )
    }
}

export default List;