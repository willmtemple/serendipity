import { observer } from 'mobx-react';
import * as React from 'react';

import { Number } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import { useResizeParentEffect } from 'src/hooks/measure';

// tslint:disable-next-line: variable-name ban-types
const Number = React.forwardRef<SVGForeignObjectElement, { number: Number }>((props, ref) => {
    useResizeParentEffect();

    function setValue(evt: React.ChangeEvent<HTMLInputElement>) {
        const v = parseFloat(evt.target.value);
        if (v !== undefined && !isNaN(v)) {
            props.number.value = v;
        } else if (evt.target.value === "") {
            props.number.value = 0;
        }
    }

    return (
        <foreignObject ref={ref} width={67} height={30}>
            <input type="number" placeholder="0" value={props.number.value} onChange={setValue} />
        </foreignObject>
    )
})

export default observer(Number);