import { observer } from 'mobx-react';
import * as React from 'react';
import Indent from 'components/layout/Indent';
import Expression from '../expression';
const Do = React.forwardRef((props, ref) => (React.createElement("g", { ref: ref },
    React.createElement("text", null, "do"),
    React.createElement(Indent, { x: 32 },
        React.createElement(Expression, { bind: props.do, bindKey: "body" })))));
export default observer(Do);
