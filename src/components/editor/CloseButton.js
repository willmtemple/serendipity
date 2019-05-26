import React, { Component } from 'react';

export default class CloseButton extends Component {
    render() {
        return (
            <g onClick={this.props.onClick}>
                <rect x={0} y={0} width={18} height={18} rx="2" fill="white" />
                <line x1={4} x2={14} y1={4} y2={14} stroke="black" strokeLinecap="round" strokeWidth={4} />
                <line x2={4} x1={14} y1={4} y2={14} stroke="black" strokeLinecap="round" strokeWidth={4} />
            </g>
        )
    }
}