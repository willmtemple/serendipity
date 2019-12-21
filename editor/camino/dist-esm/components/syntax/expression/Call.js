import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
import Indent from '../../layout/Indent';
const Call = React.forwardRef((props, ref) => {
    return (React.createElement(SvgFlex, { ref: ref, direction: "vertical", padding: 10 },
        React.createElement(SvgFlex, { direction: "horizontal", align: "end", padding: 20 },
            React.createElement(Expression, { bind: props.call, bindKey: "callee" }),
            React.createElement("text", null, "(")),
        React.createElement(Indent, { x: 36 },
            React.createElement(SvgFlex, { direction: "vertical", padding: 20 }, props.call.parameters.map((_, idx) => React.createElement(Expression, { key: idx, bind: props.call, bindKey: "parameters", bindIdx: idx })))),
        React.createElement("text", null, ")")));
});
export default observer(Call);
