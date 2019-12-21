import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
const If = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "vertical", padding: 20 },
    React.createElement(SvgFlex, { direction: "horizontal", padding: 20 },
        React.createElement("text", null, "if"),
        React.createElement(Expression, { bind: props._if, bindKey: "cond" })),
    React.createElement(SvgFlex, { direction: "horizontal", padding: 20 },
        React.createElement("text", null, "? then"),
        React.createElement(Expression, { bind: props._if, bindKey: "then" })),
    React.createElement(SvgFlex, { direction: "horizontal", padding: 20 },
        React.createElement("text", null, ": else"),
        React.createElement(Expression, { bind: props._if, bindKey: "_else" })))));
export default observer(If);
