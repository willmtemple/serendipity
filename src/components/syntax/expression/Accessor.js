import React, { Component } from 'react'
import { observer } from 'mobx-react';
import Expression from '.';
import SvgHorizontal from '../../layout/SvgHorizontal';

@observer
class Accessor extends Component {
    render() {
        return (
            <SvgHorizontal parent={this.props.parent} padding={20}>
                <Expression expression={this.props.accessor.accessee} />
                <text>.</text>
                <Expression expression={this.props.accessor.index} />
            </SvgHorizontal>
        )
    }
}

export default Accessor;