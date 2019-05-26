import React, { Component } from 'react';
import { observer } from 'mobx-react';

import Expression from '../expression';
import CloseButton from '../../editor/CloseButton';

@observer
class DefineFunc extends Component {
    constructor(props) {
        super(props);

        this.addParam = this.addParam.bind(this);
    }

    rename(name) {
        this.props.definefunc.name = name;
    }

    renameParam(idx, name) {
        if (name === '') {
            this.props.definefunc.parameters.splice(idx, 1);
        } else {
            this.props.definefunc.parameters[idx] = name;
        }
    }

    addParam() {
        this.props.definefunc.parameters.push('new');
    }

    render() {
        let paramOff = 200;
        let firstParam = true;
        return (
            <g className="blockDefine">
                <CloseButton onClick={this.props.onDelete} />
                <text x={30} y={25} fontWeight={900}>define</text>
                <foreignObject x={100} y={5} width={100} height={30} style={{ overflow: "visible" }}>
                    <input type="text" value={this.props.definefunc.name} style={{ width: "80px" }} onChange={(e) => this.rename(e.target.value)} />
                </foreignObject>
                <text x={paramOff} y={25}>(</text>
                {paramOff += 10}
                {this.props.definefunc.parameters.map((p, idx) =>
                    <g key={idx} transform={`translate(${paramOff},5)`}>
                        {
                            !firstParam && <text y={25}>, </text>
                        }
                        <foreignObject x={firstParam ? 0 : 20} width={100} height={30} style={{ overflow: "visible" }}>
                            <input type="text" value={p} style={{ width: "60px" }} onChange={(e) => this.renameParam(idx, e.target.value)} />
                        </foreignObject>
                        {paramOff += firstParam ? 80 : 100}
                        {firstParam = false}
                    </g>
                )}
                <text x={paramOff} y={25}>)</text>
                <g className="add" transform={`translate(${paramOff + 20}, 10)`} onClick={this.addParam}>
                    <rect x={0} y={0} width={18} height={18} rx="2" fill="white" />
                    <line x1={9} x2={9} y1={4} y2={14} stroke="black" strokeLinecap="round" strokeWidth={4} />
                    <line x2={4} x1={14} y1={9} y2={9} stroke="black" strokeLinecap="round" strokeWidth={4} />
                </g>
                <g className="exprBox" transform="translate(30, 60)">
                    <Expression parent={this.props.parent} expression={this.props.definefunc.body} />
                </g>
            </g>
        );
    }
}

export default DefineFunc;