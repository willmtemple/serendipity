import { inject, observer } from 'mobx-react';
import * as React from 'react';

import { SyntaxObject } from 'proto-syntax/dist/lib/lang/syntax';
import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import SyntaxHole from 'src/components/editor/SyntaxHole';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import { ProjectStore } from 'src/stores/ProjectStore';
import withStores from 'src/util/withStores';
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

function getPadding(kind: string) {
    switch (kind) {
        case "number":
        case "name":
            return 10;
        default:
            return 6;
    }
}

function getColor(kind: string) {
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
    parent?: ISizedComponent,
    bind: SyntaxObject,
    bindKey: string,
    bindIdx? : number

    fixed? : boolean,

    // Injected
    ProjectStore: ProjectStore
}

@inject('ProjectStore')
@observer
class Expression extends React.Component<IExpressionProps> {
    public render() {
        const expr = (this.props.bindIdx === undefined) ? this.props.bind[this.props.bindKey] : this.props.bind[this.props.bindKey][this.props.bindIdx];
        const kind = expr.exprKind;

        if (kind === "@hole") {
            return <SyntaxHole parent={this.props.parent} bind={this.props.bind} bindKey={this.props.bindKey} bindIdx={this.props.bindIdx} />
        }

        const body = (() => {
            switch (kind) {
                case "if":
                    return <If _if={expr as expression.If} />
                case "void":
                    return <Void />
                case "tuple":
                    return <Tuple tuple={expr as expression.Tuple} />
                case "number":
                    return <Number number={expr as expression.Number} />
                case "closure":
                    return <Closure closure={expr as expression.Closure} />
                case "compare":
                    return <Compare compare={expr as expression.Compare} />
                case "name":
                    return <Name name={expr as expression.Name} />
                case "arithmetic":
                    return <Arithmetic arithmetic={expr as expression.Arithmetic} />
                case "call":
                    return <Call call={expr as expression.Call} />
                case "accessor":
                    return <Accessor accessor={expr as expression.Accessor} />
                case "procedure":
                    return <Procedure procedure={expr as expression.Procedure} />
                case "list":
                    return <List list={expr as expression.List} />
                default:
                    return (
                        <text fill="white" fontFamily="Source Code Pro" fontWeight="600">{expr.exprKind} (unimplemented)</text>
                    );
            }
        })();

        const containerProps : {[k: string] : any} = {};
        const guid = this.props.ProjectStore.metadataFor(expr).guid;
        containerProps.id = guid;
        containerProps.className = this.props.fixed ? "expression" : "draggable expression";
        containerProps["data-parent-guid"] = this.props.ProjectStore.metadataFor(this.props.bind).guid;
        containerProps["data-mutation-key"] = this.props.bindKey;
        if (this.props.bindIdx !== undefined) {
            containerProps["data-mutation-idx"] = this.props.bindIdx;
        }

        return (
            <BoundingBox
                parent={this.props.parent}
                padding={getPadding(kind)}
                color={getColor(kind)}
                kind={kind}
                containerProps={containerProps}>
                {body}
            </BoundingBox>
        )
    }
}

export default withStores('ProjectStore')(Expression);