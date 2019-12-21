import { observer } from 'mobx-react';
import * as React from 'react';

import { SyntaxObject } from '@serendipity/syntax';
import { statement } from '@serendipity/syntax-surface';
import SyntaxHole from 'components/editor/StatementHole';
import StatementBlock from 'components/layout/StatementBlock';
import { useStores } from 'hooks/stores';
import Do from './Do';
import ForIn from './ForIn';
import Print from './Print';

function getColor(kind: string) {
    switch (kind) {
        case "print":
            return "#1F75FE";
        case "forin":
            return "grey";
        default:
            return "black";
    }
}

interface IStatementProps {
    bind: SyntaxObject,
    bindKey: string,
    bindIdx?: number,

    fixed?: boolean,
}

const Statement = React.forwardRef<any, IStatementProps>((props, ref) => {
    const { ProjectStore } = useStores();

    const stmt = (
        (props.bindIdx === undefined)
            ? props.bind[props.bindKey]
            : props.bind[props.bindKey][props.bindIdx]
    ) as statement.Statement;

    if (stmt.statementKind === "@hole") {
        return <SyntaxHole ref={ref}
            bind={props.bind}
            bindKey={props.bindKey}
            bindIdx={props.bindIdx}
            kind="statement" />
    }

    const body = (() => {
        switch (stmt.statementKind) {
            case "print":
                return <Print print={stmt as statement.Print} />;
            case "forin":
                return <ForIn forin={stmt as statement.ForIn} />;
            case "do":
                return <Do do={stmt as statement.Do} />;
            default:
                return (
                    <text ref={ref} fill="white" fontFamily="Source Code Pro" fontWeight="600">{stmt.statementKind} (unimplemented)</text>
                );
        }
    })();

    // Set up node metadata for DOM access
    const containerProps: { [k: string]: any } = {};
    const guid = ProjectStore.metadataFor(stmt).guid;
    containerProps.id = guid;
    containerProps.className = (props.fixed ? "statement" : "draggable syntax statement") + " " + stmt.statementKind;
    containerProps["data-guid"] = guid;
    containerProps["data-parent-guid"] = ProjectStore.metadataFor(props.bind).guid;
    containerProps["data-mutation-key"] = props.bindKey;
    if (props.bindIdx !== undefined) {
        containerProps["data-mutation-idx"] = props.bindIdx;
    }

    return (
        <StatementBlock ref={ref}
            color={getColor(stmt.statementKind)}
            containerProps={containerProps}>
            {body}
        </StatementBlock>
    )
})

export default observer(Statement);