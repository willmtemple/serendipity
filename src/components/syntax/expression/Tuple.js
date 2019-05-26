import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '.';
import SvgVertical from '../../layout/SvgVertical';
import Indent from '../../layout/Indent';

@observer
class Tuple extends Component {
    render() {
        console.log("Tuple is rendering")
        return (
            <SvgVertical parent={this.props.parent} padding={10}>
                <text>(</text>
                <Indent x={36}>
                    <SvgVertical padding={20}>
                        {this.props.tuple.values.map((v, idx) =>
                            <Expression key={idx} expression={v} />
                        )}
                    </SvgVertical>
                </Indent>
                <text>)</text>
            </SvgVertical>
        )
    }
}

export default Tuple;