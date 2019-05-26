import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Print from './Print';
import ForIn from './ForIn';

@observer
class Statement extends Component {
    render() {
        switch (this.props.statement.statementKind) {
            case "print":
                return <Print parent={this.props.parent} print={this.props.statement} />;
            case "forin":
                return <ForIn parent={this.props.parent} forin={this.props.statement} />;
            default:
                return (
                    <text fill="white" fontFamily="Source Code Pro" fontWeight="600">{this.props.statement.statementKind} (unimplemented)</text>
                );
        }
    }
}

export default Statement;