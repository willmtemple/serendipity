import { observer } from 'mobx-react';
import * as React from 'react';

import { SyntaxObject } from 'proto-syntax/dist/lib/lang/syntax';
import { statement } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import { ProjectStore } from 'src/stores/ProjectStore';

import BoundingBox from '../../layout/BoundingBox';
import Do from './Do';
import ForIn from './ForIn';
import Print from './Print';

import SyntaxHole from 'src/components/editor/SyntaxHole';
import withStores from 'src/util/withStores';

function getColor(kind : string) {
    switch(kind) {
        case "print":
            return "darkgrey";
        case "forin":
            return "grey";
        default:
            return "black";
    }
}

interface IStatementProps {
    parent? : ISizedComponent,
    bind: SyntaxObject,
    bindKey: string,
    bindIdx? : number,

    fixed? : boolean,

    ProjectStore: ProjectStore
}

@observer
class Statement extends React.Component<IStatementProps> {
    public render() {
        const stmt = (this.props.bindIdx === undefined) ? this.props.bind[this.props.bindKey] : this.props.bind[this.props.bindKey][this.props.bindIdx];

        if (stmt.statementKind === "@hole") {
            return <SyntaxHole  parent={this.props.parent}
                                bind={this.props.bind}
                                bindKey={this.props.bindKey}
                                bindIdx={this.props.bindIdx}
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
                        <text fill="white" fontFamily="Source Code Pro" fontWeight="600">{stmt.statementKind} (unimplemented)</text>
                    );
            }
        })();

        // Set up node metadata for DOM access
        const containerProps : {[k: string] : any} = {};
        const guid = this.props.ProjectStore.metadataFor(stmt).guid;
        containerProps.id = guid;
        containerProps.className = this.props.fixed ? "statement" : "draggable syntax statement";
        containerProps["data-guid"] = this.props.ProjectStore.metadataFor(stmt);
        containerProps["data-parent-guid"] = this.props.ProjectStore.metadataFor(this.props.bind).guid;
        containerProps["data-mutation-key"] = this.props.bindKey;
        if (this.props.bindIdx !== undefined) {
            containerProps["data-mutation-idx"] = this.props.bindIdx;
        }

        return (
            <BoundingBox
            parent={this.props.parent}
            padding={6}
            color={getColor(stmt.statementKind)}
            kind={stmt.statementKind}
            containerProps={containerProps}>
                {body}
            </BoundingBox>
        )
    }
}

export default withStores('ProjectStore')(Statement);