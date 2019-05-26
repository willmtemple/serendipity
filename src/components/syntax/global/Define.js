import React, { Component } from 'react';
import { observer } from 'mobx-react';

import Expression from '../expression';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';

@observer
class Define extends Component {
    render() {
        console.log("Define is rendering: ", this.props.define.metadata.editor.guid)
        return (
            <g>
                <CloseButton onClick={this.props.onDelete} />
                <text x={30} fontWeight={900}>define</text>
                <g transform="translate(100, 0)">
                    <Binder parent={this.props.parent} bind={this.props.define} bindKey="name" />
                </g>
                <g transform="translate(30, 48)">
                    <Expression parent={this.props.parent} expression={this.props.define.value} />
                </g>
            </g>
        );
    }
}

export default Define;