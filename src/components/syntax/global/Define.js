import React, { Component } from 'react';
import { observer } from 'mobx-react';

import Expression from '../expression';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Indent from '../../layout/Indent';

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
                <Indent parent={this.props.parent} x={36} y={48}>
                    <Expression expression={this.props.define.value} />
                </Indent>
            </g>
        );
    }
}

export default Define;