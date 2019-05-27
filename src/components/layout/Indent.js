import React, { PureComponent } from 'react';

export default class Indent extends PureComponent {
    render() {
        const children = React.Children.map(this.props.children, (c) =>
            React.cloneElement(c, {
                parent: this.props.parent,
            })
        )
        return (
            <g transform={`translate(${this.props.x || 0}, ${this.props.y || 0})`}>
                {children}
            </g>
        )
    }
}