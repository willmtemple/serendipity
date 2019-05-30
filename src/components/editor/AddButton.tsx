import * as React from 'react';

export default class AddButton extends React.Component<{onClick: () => void}> {
    public render() {
        return (
            <g onClick={this.props.onClick} className="add button">
                <rect x={0} y={0} width={18} height={18} rx="2" fill="white" />
                <line x1={9} x2={9} y1={4} y2={14} stroke="black" strokeLinecap="round" strokeWidth={4} />
                <line x2={4} x1={14} y1={9} y2={9} stroke="black" strokeLinecap="round" strokeWidth={4} />
            </g>
        )
    }
}