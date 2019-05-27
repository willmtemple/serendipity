import React, { Component } from 'react';
import { observer } from 'mobx-react';

import Expression from '../expression';
import CloseButton from '../../editor/CloseButton';
import Binder from '../../editor/Binder';
import { arrayEqual } from '../../../util';
import AddButton from '../../editor/AddButton';
import SvgHorizontal from '../../layout/SvgHorizontal';

@observer
class DefineFunc extends Component {
    constructor(props) {
        super(props);

        this.cachedParameters = null;
        this.cachedBinderLine = null;

        this.addParam = this.addParam.bind(this);
    }

    _getBinderLine() {
        if (!arrayEqual(this.cachedParameters, this.props.definefunc.parameters)) {
            // Update cache
            this.cachedParameters = [...this.props.definefunc.parameters];

            const binderLine = [
                <CloseButton key="df_close" onClick={this.props.onDelete} />,
                <text key="df_label">define</text>,
                <Binder key="df_name" bind={this.props.definefunc} bindKey="name" />,
                <text key="df_open_paren">(</text>
            ];

            this.props.definefunc.parameters.forEach((_, idx) => {
                binderLine.push(<Binder key={idx} bind={this.props.definefunc.parameters} bindKey={idx} />);
                if (idx + 1 !== this.props.definefunc.parameters.length) {
                    binderLine.push(<text key={"df_comma_" + idx}>, </text>);
                }
            });
            binderLine.push(<text key="df_close_paren">)</text>)
            binderLine.push(<AddButton key="df_expand" onClick={this.addParam} />)
            binderLine.push(<text key="df_arrow">=></text>)

            this.cachedBinderLine = binderLine;
        }
        return this.cachedBinderLine
    }

    addParam() {
        this.props.definefunc.parameters.push('new');
    }

    render() {
        console.log("DefineFunc is rendering");
        return (
            <g>
                <SvgHorizontal parent={this.props.parent} padding={10}>
                    {this._getBinderLine()}
                </SvgHorizontal>
                <g className="exprBox" transform="translate(30, 60)">
                    <Expression parent={this.props.parent} expression={this.props.definefunc.body} />
                </g>
            </g>
        );
    }
}

export default DefineFunc;