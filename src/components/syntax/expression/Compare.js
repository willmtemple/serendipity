import React, { Component } from 'react'
import { observer } from 'mobx-react';
import Expression from '.';
import SvgHorizontal from '../../layout/SvgHorizontal';

@observer
class Compare extends Component {
    render() {
        return (
            <SvgHorizontal parent={this.props.parent} padding={20}>
                <Expression expression={this.props.compare.left} />
                <text>{this.props.compare.op}</text>
                <Expression expression={this.props.compare.right} />
            </SvgHorizontal>
        )
    }
}

export default Compare;