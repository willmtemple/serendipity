import * as React from 'react';

import { observer } from 'mobx-react';

import { statement } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import { IEditorDetachedSyntax } from 'src/stores/ProjectStore';
import Expression from '../expression';
import Statement from '../statement';

interface IDetachedProps {
    parent?: ISizedComponent,
    global: IEditorDetachedSyntax,

    onDelete(): void,
}

@observer
class Detached extends React.Component<IDetachedProps> {
    public render() {
        const kind = this.props.global.syntaxKind;
        const element = this.props.global.element;

        const body = (() => {
            switch (kind) {
                case "expression":
                    return <Expression
                        parent={this.props.parent}
                        fixed={true}
                        bind={this.props.global}
                        bindKey="element" />
                case "statement":
                    return <Statement
                        parent={this.props.parent}
                        statement={element as statement.Statement} />
                default:
                    const _exhaust: never = kind;
                    return _exhaust;

            }
        })();

        return (
            <g filter="url(#detachedElement)" opacity="0.8">
                {body}
            </g>
        );
    }
}

export default Detached;