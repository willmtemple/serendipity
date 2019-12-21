import { observer } from 'mobx-react';
import * as React from 'react';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Indent from '../../layout/Indent';
import Expression from '../expression';
const Define = React.forwardRef((props, ref) => (React.createElement("g", { ref: ref },
    React.createElement(CloseButton, { onClick: props.onDelete }),
    React.createElement(Indent, { x: 32, y: 8 },
        React.createElement("text", null, "define")),
    React.createElement(Indent, { x: 96 },
        React.createElement(Binder, { bind: props.define, bindKey: "name" })),
    React.createElement(Indent, { x: 36, y: 48 },
        React.createElement(Expression, { bind: props.define, bindKey: "value" })))));
export default observer(Define);
