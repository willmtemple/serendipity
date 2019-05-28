import { observer } from 'mobx-react';
import * as React from 'react';

import { statement } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import BoundingBox from '../../layout/BoundingBox';
import Do from './Do';
import ForIn from './ForIn';
import Print from './Print';

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

    statement: statement.Statement
}

@observer
class Statement extends React.Component<IStatementProps> {
    public render() {
        const kind = this.props.statement.statementKind;
        const body = (() => {
            switch (kind) {
                case "print":
                    return <Print print={this.props.statement as statement.Print} />;
                case "forin":
                    return <ForIn forin={this.props.statement as statement.ForIn} />;
                case "do":
                    return <Do do={this.props.statement as statement.Do} />;
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