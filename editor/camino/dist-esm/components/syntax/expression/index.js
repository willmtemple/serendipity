import { observer } from 'mobx-react';
import * as React from 'react';
import ExpressionBlock from 'components/layout/ExpressionBlock';
import { useStores } from 'hooks/stores';
import SyntaxHole from 'components/editor/ExpressionHole';
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
import With from './With';
/*function getPadding(kind: string) {
    switch (kind) {
        case "number":
        case "name":
            return 10;
        case "void":
            return 20;
        default:
            return 6;
    }
}*/
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
        case "with":
            return "palevioletred";
        default:
            return "black";
    }
}
const Expression = React.forwardRef((props, ref) => {
    const { ProjectStore } = useStores();
    const expr = ((props.bindIdx === undefined)
        ? props.bind[props.bindKey]
        : props.bind[props.bindKey][props.bindIdx]);
    const kind = expr.exprKind;
    if (kind === "@hole") {
        return React.createElement(SyntaxHole, { ref: ref, bind: props.bind, bindKey: props.bindKey, bindIdx: props.bindIdx, kind: "expression" });
    }
    const body = (() => {
        switch (kind) {
            case "if":
                return React.createElement(If, { _if: expr });
            case "void":
                return React.createElement(Void, null);
            case "tuple":
                return React.createElement(Tuple, { tuple: expr });
            case "number":
                return React.createElement(Number, { number: expr });
            case "closure":
                return React.createElement(Closure, { closure: expr });
            case "compare":
                return React.createElement(Compare, { compare: expr });
            case "name":
                return React.createElement(Name, { name: expr });
            case "arithmetic":
                return React.createElement(Arithmetic, { arithmetic: expr });
            case "call":
                return React.createElement(Call, { call: expr });
            case "accessor":
                return React.createElement(Accessor, { accessor: expr });
            case "procedure":
                return React.createElement(Procedure, { procedure: expr });
            case "list":
                return React.createElement(List, { list: expr });
            case "with":
                return React.createElement(With, { with: expr });
            default:
                return (React.createElement("text", { ref: ref, fill: "white", fontFamily: "Source Code Pro", fontWeight: "600" },
                    expr.exprKind,
                    " (unimplemented)"));
        }
    })();
    // Set up node metadata for DOM access
    const containerProps = {};
    const guid = ProjectStore.metadataFor(expr).guid;
    containerProps.id = guid;
    containerProps.className = props.fixed ? "expression" : "draggable syntax expression";
    containerProps["data-guid"] = ProjectStore.metadataFor(expr).guid;
    containerProps["data-parent-guid"] = ProjectStore.metadataFor(props.bind).guid;
    containerProps["data-mutation-key"] = props.bindKey;
    if (props.bindIdx !== undefined) {
        containerProps["data-mutation-idx"] = props.bindIdx;
    }
    return (React.createElement(ExpressionBlock, { ref: ref, color: getColor(kind), containerProps: containerProps }, body));
});
export default observer(Expression);
