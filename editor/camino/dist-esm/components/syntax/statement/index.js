import { observer } from 'mobx-react';
import * as React from 'react';
import SyntaxHole from 'components/editor/StatementHole';
import StatementBlock from 'components/layout/StatementBlock';
import { useStores } from 'hooks/stores';
import Do from './Do';
import ForIn from './ForIn';
import Print from './Print';
function getColor(kind) {
    switch (kind) {
        case "print":
            return "#1F75FE";
        case "forin":
            return "grey";
        default:
            return "black";
    }
}
const Statement = React.forwardRef((props, ref) => {
    const { ProjectStore } = useStores();
    const stmt = ((props.bindIdx === undefined)
        ? props.bind[props.bindKey]
        : props.bind[props.bindKey][props.bindIdx]);
    if (stmt.statementKind === "@hole") {
        return React.createElement(SyntaxHole, { ref: ref, bind: props.bind, bindKey: props.bindKey, bindIdx: props.bindIdx, kind: "statement" });
    }
    const body = (() => {
        switch (stmt.statementKind) {
            case "print":
                return React.createElement(Print, { print: stmt });
            case "forin":
                return React.createElement(ForIn, { forin: stmt });
            case "do":
                return React.createElement(Do, { do: stmt });
            default:
                return (React.createElement("text", { ref: ref, fill: "white", fontFamily: "Source Code Pro", fontWeight: "600" },
                    stmt.statementKind,
                    " (unimplemented)"));
        }
    })();
    // Set up node metadata for DOM access
    const containerProps = {};
    const guid = ProjectStore.metadataFor(stmt).guid;
    containerProps.id = guid;
    containerProps.className = (props.fixed ? "statement" : "draggable syntax statement") + " " + stmt.statementKind;
    containerProps["data-guid"] = guid;
    containerProps["data-parent-guid"] = ProjectStore.metadataFor(props.bind).guid;
    containerProps["data-mutation-key"] = props.bindKey;
    if (props.bindIdx !== undefined) {
        containerProps["data-mutation-idx"] = props.bindIdx;
    }
    return (React.createElement(StatementBlock, { ref: ref, color: getColor(stmt.statementKind), containerProps: containerProps }, body));
});
export default observer(Statement);
