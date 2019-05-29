import * as React from 'react';

import { ISizedComponent } from './SizedComponent';

interface IIndentProps {
    parent?: ISizedComponent

    x?: number,
    y?: number
}

export default class Indent extends React.PureComponent<IIndentProps> {
    public render() {
        const children = React.Children.map(this.props.children, (c) =>
            React.isValidElement(c) ?
                // TODO: I want to type this correctly rather than cast to any
                React.cloneElement(c, {
                    parent: this.props.parent,
                } as any) :
                c
        )
        return (
            <g transform={`translate(${this.props.x || 0}, ${this.props.y || 0})`}>
                {children}
            </g>
        )
    }
}