import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '.';
import SvgVertical from '../../layout/SvgVertical';
import SvgHorizontal from '../../layout/SvgHorizontal';

@observer
class If extends Component {
    render() {
        return (
            <SvgVertical parent={this.props.parent} padding={20}>
                <SvgHorizontal padding={20}>
                    <text>if</text>
                    <Expression parent={this.props.parent} expression={this.props._if.cond} />
                </SvgHorizontal>
                <SvgHorizontal padding={20}>
                    <text>? then</text>
                    <Expression parent={this.props.parent} expression={this.props._if.then} />
                </SvgHorizontal>
                <SvgHorizontal padding={20}>
                    <text>: else</text>
                    <Expression parent={this.props.parent} expression={this.props._if._else} />
                </SvgHorizontal>
            </SvgVertical>
        )
    }
}

export default If;