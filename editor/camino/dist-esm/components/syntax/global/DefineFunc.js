import { observer } from 'mobx-react';
import * as React from 'react';
import Indent from 'components/layout/Indent';
import SvgFlex from 'components/layout/SvgFlex';
import AddButton from '../../editor/AddButton';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Expression from '../expression';
const DefineFunc = React.forwardRef((props, ref) => {
    function addParam() {
        props.definefunc.parameters.push('new');
    }
    let binderLine = [
        React.createElement("text", { key: "s_dfn_label" }, "define"),
        React.createElement(Binder, { key: "s_dfn_name", bind: props.definefunc, bindKey: "name" }),
        React.createElement("text", { key: "s_dfn_open_paren" }, "(")
    ];
    props.definefunc.parameters.forEach((p, idx) => {
        binderLine.push(React.createElement(Binder, { key: `dfn_bind-${p}-${idx}`, bind: props.definefunc.parameters, bindKey: idx }));
        if (idx < props.definefunc.parameters.length - 1) {
            binderLine.push(React.createElement("text", { key: `s_dfn_comma_${idx}` }, ","));
        }
    });
    binderLine = binderLine.concat([
        React.createElement("text", { key: "s_dfn_close_paren" }, ")"),
        React.createElement(AddButton, { key: "s_dfn_add_button", onClick: addParam }),
        React.createElement("text", { key: "s_dfn_arrow" }, "=>")
    ]);
    return (React.createElement("g", { ref: ref },
        React.createElement(CloseButton, { onClick: props.onDelete }),
        React.createElement(Indent, { x: 32 },
            React.createElement(SvgFlex, { direction: "horizontal", align: "middle", padding: 10 }, binderLine)),
        React.createElement(Indent, { x: 32, y: 64 },
            React.createElement(Expression, { bind: props.definefunc, bindKey: "body" }))));
});
export default observer(DefineFunc);
