import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '../expression';

@observer
class Do extends Component {
    render() {
        return (
            <g>
                <text>do</text>
                <g transform="translate(32, 0)">
                    <Expression parent={this.props.parent} expression={this.props.do.body} />
                </g>
            </g >
        );
    }
}

export default Do;