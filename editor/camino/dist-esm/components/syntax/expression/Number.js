import { observer } from 'mobx-react';
import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';
// tslint:disable-next-line: variable-name ban-types
const Number = React.forwardRef((props, ref) => {
    useResizeParentEffect();
    const [vacant, setVacant] = React.useState(false);
    function setValue(evt) {
        const v = parseFloat(evt.target.value);
        if (v !== undefined && !isNaN(v)) {
            setVacant(false);
            props.number.value = v;
        }
        else if (evt.target.value === "") {
            props.number.value = 0;
            setVacant(true);
        }
    }
    return (React.createElement("foreignObject", { ref: ref, width: 67, height: 30 },
        React.createElement("input", { type: "number", placeholder: "0", value: vacant ? undefined : props.number.value, onChange: setValue })));
});
export default observer(Number);
