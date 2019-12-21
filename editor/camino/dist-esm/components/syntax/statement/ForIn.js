import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Statement from '.';
import Binder from '../../editor/Binder';
import Indent from '../../layout/Indent';
import Expression from '../expression';
const ForIn = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "vertical", padding: 20 },
    React.createElement(SvgFlex, { direction: "horizontal", padding: 20 },
        React.createElement("text", null, "for"),
        React.createElement(Binder, { bind: props.forin, bindKey: "binding" }),
        React.createElement("text", null, "in"),
        React.createElement(Expression, { bind: props.forin, bindKey: "value" })),
    React.createElement(Indent, { x: 36 },
        React.createElement(Statement, { bind: props.forin, bindKey: "body" })))));
export default observer(ForIn);
