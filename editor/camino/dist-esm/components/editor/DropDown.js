import { observer } from 'mobx-react';
import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';
const DropDown = (() => React.forwardRef((props, ref) => {
    useResizeParentEffect();
    function change(evt) {
        const v = parseInt(evt.target.value, 10);
        props.callback(props.options[v].value);
    }
    return (React.createElement("foreignObject", { ref: ref, width: 67, height: 30 },
        React.createElement("select", { value: props.selected, onChange: props.callback && change }, props.options.map((o, i) => React.createElement("option", { value: i }, o.label)))));
}))();
export default observer(DropDown);
