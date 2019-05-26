import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '../expression';
import SvgHorizontal from '../../layout/SvgHorizontal';
import Binder from '../../editor/Binder';
import SvgVertical from '../../layout/SvgVertical';
import Statement from '.';
import Indent from '../../layout/Indent';

@observer
class ForIn extends Component {
    render() {
        return (
            <SvgVertical parent={this.props.parent} padding={20}>
                <SvgHorizontal padding={20}>
                    <text>for</text>
                    <Binder bind={this.props.forin} bindKey="binding" />
                    <text>in</text>
                    <Expression expression={this.props.forin.value} />
                </SvgHorizontal>
                <Indent x={36}>
                    <Statement statement={this.props.forin.body} />
                </Indent>
            </SvgVertical>
        );
    }
}

export default ForIn;