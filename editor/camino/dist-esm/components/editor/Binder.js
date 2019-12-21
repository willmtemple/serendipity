import { observer } from 'mobx-react';
import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';
const Binder = React.forwardRef((props, ref) => {
    useResizeParentEffect();
    function change(evt) {
        const v = evt.target.value;
        if (v === '' && typeof props.bindKey === 'number') {
            props.bind.splice(props.bindKey, 1);
            return;
        }
        props.bind[props.bindKey] = v;
    }
    return (React.createElement("foreignObject", { ref: ref, width: 67, height: 30 },
        React.createElement("input", { type: "text", value: props.bind[props.bindKey], onChange: change })));
});
export default observer(Binder);
