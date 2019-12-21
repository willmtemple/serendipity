import * as React from 'react';
import { observer } from 'mobx-react';
import Expression from '../expression';
import Statement from '../statement';
const Detached = React.forwardRef((props, ref) => {
    const kind = props.global.syntaxKind;
    const body = (() => {
        switch (kind) {
            case "expression":
                return React.createElement(Expression, { fixed: true, bind: props.global, bindKey: "element" });
            case "statement":
                return React.createElement(Statement, { fixed: true, bind: props.global, bindKey: "element", bindIdx: 0 });
            default:
                const _exhaust = kind;
                return _exhaust;
        }
    })();
    return (React.createElement("g", { ref: ref, filter: "url(#detachedElement)", opacity: "0.8" }, body));
});
export default observer(Detached);
