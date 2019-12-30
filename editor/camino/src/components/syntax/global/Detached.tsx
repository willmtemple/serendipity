import * as React from 'react';

import { observer } from 'mobx-react';

import { EditorDetachedSyntax } from '../../../stores/ProjectStore';

import Expression from '../expression';
import Statement from '../statement';

interface DetachedProps {
    global: EditorDetachedSyntax,

    onDelete(): void,
}

const Detached = React.forwardRef<SVGGElement, DetachedProps>((props, ref) => {
    const kind = props.global.syntaxKind;

    const body = (() => {
        switch (kind) {
            case "expression":
                return <Expression
                    fixed={true}
                    bind={props.global}
                    bindKey="element" />
            case "statement":
                return <Statement
                    fixed={true}
                    bind={props.global}
                    bindKey="element"
                    bindIdx={0} />
            default:
                const _exhaust: never = kind;
                return _exhaust;

        }
    })();

    return (
        <g ref={ref} filter="url(#detachedElement)" opacity="0.8">
            {body}
        </g>
    );
})

export default observer(Detached);