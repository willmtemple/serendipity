import { observer } from 'mobx-react';
import * as React from 'react';
import Binder from 'components/editor/Binder';
import Indent from 'components/layout/Indent';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from './';
const With = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "vertical", padding: 20 },
    React.createElement(SvgFlex, { direction: "horizontal", align: "middle", padding: 20 },
        React.createElement("text", null, "with"),
        React.createElement(Binder, { bind: props.with.binding, bindKey: "0" }),
        React.createElement("text", null, "="),
        React.createElement(Expression, { bind: props.with, bindKey: "binding", bindIdx: 1 })),
    React.createElement(Indent, { x: 32 },
        React.createElement(Expression, { bind: props.with, bindKey: "expr" })))));
export default observer(With);
