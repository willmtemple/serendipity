import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
import AddButton from '../../editor/AddButton';
import Binder from '../../editor/Binder';
import Indent from '../../layout/Indent';
const Closure = React.forwardRef((props, ref) => {
    function addParam() {
        props.closure.parameters.push('new');
    }
    let binderLine = [
        React.createElement("text", { key: "s_clos_open_paren" }, "(")
    ];
    props.closure.parameters.forEach((p, idx) => {
        binderLine.push(React.createElement(Binder, { key: `clos_bind-${p}-${idx}`, bind: props.closure.parameters, bindKey: idx }));
        if (idx < props.closure.parameters.length - 1) {
            binderLine.push(React.createElement("text", { key: `s_clos_comma_${idx}` }, ","));
        }
    });
    binderLine = binderLine.concat([
        React.createElement("text", { key: "s_clos_close_paren" }, ")"),
        React.createElement(AddButton, { key: "s_clos_add_button", onClick: addParam }),
        React.createElement("text", { key: "s_clos_arrow" }, "=>")
    ]);
    return (React.createElement(SvgFlex, { ref: ref, direction: "vertical", padding: 20 },
        React.createElement(SvgFlex, { direction: "horizontal", align: "middle", padding: 10 }, binderLine),
        React.createElement(Indent, { x: 36 },
            React.createElement(Expression, { bind: props.closure, bindKey: "body" }))));
});
export default observer(Closure);
