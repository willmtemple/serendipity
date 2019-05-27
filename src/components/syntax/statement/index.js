import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Print from './Print';
import ForIn from './ForIn';
import BoundingBox from '../../layout/BoundingBox';
import Do from './Do';

function getColor(kind) {
    switch(kind) {
        case "print":
            return "darkgrey";
        case "forin":
            return "grey";
        default:
            return "black";
    }
}

@observer
class Statement extends Component {
    render() {
        const kind = this.props.statement.statementKind;
        const body = (() => {
            switch (kind) {
                case "print":
                    return <Print print={this.props.statement} />;
                case "forin":
                    return <ForIn forin={this.props.statement} />;
                case "do":
                    return <Do do={this.props.statement} />;
                default:
                    return (
                        <text fill="white" fontFamily="Source Code Pro" fontWeight="600">{this.props.statement.statementKind} (unimplemented)</text>
                    );
            }
        })();

        return (
            <BoundingBox
            parent={this.props.parent}
            padding={6}
            color={getColor(kind)}
            kind={kind}>
                {body}
            </BoundingBox>
        )
    }
}

export default Statement;