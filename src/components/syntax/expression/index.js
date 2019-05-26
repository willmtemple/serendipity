import React, { Component } from 'react';
import { observer } from 'mobx-react';
import If from './If';
import Void from './Void';
import Tuple from './Tuple';
import Number from './Number';
import Closure from './Closure';
import Compare from './Compare';
import Name from './Name';
import Arithmetic from './Arithmetic';
import Call from './Call';
import Accessor from './Accessor';
import Procedure from './Procedure';
import BoundingBox from '../../layout/BoundingBox';
import List from './List';

function getColor(kind) {
    switch (kind) {
        case "if":
            return "mediumvioletred";
        case "void":
            return "black";
        case "tuple":
            return "green";
        case "number":
            return "red";
        case "list":
            return "darkgreen";
        case "name":
            return "darkorange";
        case "closure":
            return "purple";
        case "compare":
            return "darkcyan";
        case "arithmetic":
            return "midnightblue";
        case "accessor":
            return "darkslategrey";
        case "call":
            return "blueviolet";
        case "procedure":
            return "firebrick";
        default:
            return "black";
    }
}

@observer
class Expression extends Component {
    render() {
        const body = (() => {
            switch (this.props.expression.exprKind) {
                case "if":
                    return <If _if={this.props.expression} />
                case "void":
                    return <Void />
                case "tuple":
                    return <Tuple tuple={this.props.expression} />
                case "number":
                    return <Number number={this.props.expression} />
                case "closure":
                    return <Closure closure={this.props.expression} />
                case "compare":
                    return <Compare compare={this.props.expression} />
                case "name":
                    return <Name name={this.props.expression} />
                case "arithmetic":
                    return <Arithmetic arithmetic={this.props.expression} />
                case "call":
                    return <Call call={this.props.expression} />
                case "accessor":
                    return <Accessor accessor={this.props.expression} />
                case "procedure":
                    return <Procedure procedure={this.props.expression} />
                case "list":
                    return <List list={this.props.expression} />
                default:
                    return (
                        <text fill="white" fontFamily="Source Code Pro" fontWeight="600">{this.props.expression.exprKind} (unimplemented)</text>
                    );
            }
        })();

        return (
            <BoundingBox
                parent={this.props.parent}
                padding={6}
                color={getColor(this.props.expression.exprKind)}>
                {body}
            </BoundingBox>
        )
    }
}

export default Expression;