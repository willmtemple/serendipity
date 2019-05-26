import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '../expression';

@observer
class Print extends Component {
    render() {
        return (
            <g>
                <text>print</text>
                <g transform="translate(36, 22)">
                    <Expression parent={this.props.parent} expression={this.props.print.value} />
                </g>
            </g >
        );
    }
}

export default Print;