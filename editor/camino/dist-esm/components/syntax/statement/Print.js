import { observer } from 'mobx-react';
import * as React from 'react';
import Indent from 'components/layout/Indent';
import Expression from '../expression';
const Print = React.forwardRef((props, ref) => (React.createElement("g", { ref: ref },
    React.createElement(Indent, { y: 18 },
        React.createElement("text", null, "print")),
    React.createElement(Indent, { x: 60 },
        React.createElement(Expression, { bind: props.print, bindKey: "value" })))));
export default observer(Print);
