import { observer } from 'mobx-react';
import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import * as React from 'react';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import BoundingBox from '../../layout/BoundingBox';
import Accessor from './Accessor';
import Arithmetic from './Arithmetic';
import Call from './Call';
import Closure from './Closure';
import Compare from './Compare';
import If from './If';
import List from './List';
import Name from './Name';
import Number from './Number';
import Procedure from './Procedure';
import Tuple from './Tuple';
import Void from './Void';

function getPadding(kind : string) {
    switch (kind) {
        case "number":
        case "name":
            return 10;
        default:
            return 6;
    }
}

function getColor(kind : string) {
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

interface IExpressionProps {
    parent? : ISizedComponent,
    expression: expression.Expression,
}

@observer
class Expression extends React.Component<IExpressionProps> {
    public render() {
        const kind = this.props.expression.exprKind;
        const body = (() => {
            switch (kind) {
                case "if":
                    return <If _if={this.props.expression as expression.If} />
                case "void":
                    return <Void />
                case "tuple":
                    return <Tuple tuple={this.props.expression as expression.Tuple} />
                case "number":
                    return <Number number={this.props.expression as expression.Number} />
                case "closure":
                    return <Closure closure={this.props.expression as expression.Closure} />
                case "compare":
                    return <Compare compare={this.props.expression as expression.Compare} />
                case "name":
                    return <Name name={this.props.expression as expression.Name} />
                case "arithmetic":
                    return <Arithmetic arithmetic={this.props.expression as expression.Arithmetic} />
                case "call":
                    return <Call call={this.props.expression as expression.Call} />
                case "accessor":
                    return <Accessor accessor={this.props.expression as expression.Accessor} />
                case "procedure":
                    return <Procedure procedure={this.props.expression as expression.Procedure} />
                case "list":
                    return <List list={this.props.expression as expression.List} />
                default:
                    return (
                        <text fill="white" fontFamily="Source Code Pro" fontWeight="600">{this.props.expression.exprKind} (unimplemented)</text>
                    );
            }
        })();

        return (
            <BoundingBox
                parent={this.props.parent}
                padding={getPadding(kind)}
                color={getColor(kind)}
                kind={kind}>
                {body}
            </BoundingBox>
        )
    }
}

export default Expression;