import React, { Component } from 'react';
import { observer } from 'mobx-react';

import Expression from '../expression';
import CloseButton from '../../editor/CloseButton';

@observer
class Main extends Component {
    render() {
        return (
            <g>
                <CloseButton onClick={this.props.onDelete} />
                <text x={30} fontWeight={900}>when the program starts, do</text>
                <g className="exprBox" transform="translate(30, 30)">
                    <Expression parent={this.props.parent} expression={this.props.main.body} />
                </g>
            </g>
        );
    }
}

export default Main;