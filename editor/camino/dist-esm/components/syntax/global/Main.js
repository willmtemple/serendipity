import { observer } from 'mobx-react';
import * as React from 'react';
import Indent from 'components/layout/Indent';
import CloseButton from '../../editor/CloseButton';
import Expression from '../expression';
const Main = React.forwardRef((props, ref) => (React.createElement("g", { ref: ref },
    React.createElement(CloseButton, { onClick: props.onDelete }),
    React.createElement(Indent, { x: 32, y: 2 },
        React.createElement("text", null, "when the program starts, do")),
    React.createElement(Indent, { x: 32, y: 32 },
        React.createElement(Expression, { bind: props.main, bindKey: "body" })))));
export default observer(Main);
