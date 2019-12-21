import { observer } from 'mobx-react';
import * as React from 'react';

import { Number } from '@serendipity/syntax-surface/dist/expression';
import { useResizeParentEffect } from 'hooks/measure';

// tslint:disable-next-line: variable-name ban-types
const Number = React.forwardRef<SVGForeignObjectElement, { number: Number }>((props, ref) => {
    useResizeParentEffect();

    const [vacant, setVacant] = React.useState(false);

    function setValue(evt: React.ChangeEvent<HTMLInputElement>) {
        const v = parseFloat(evt.target.value);
        if (v !== undefined && !isNaN(v)) {
            setVacant(false);
            props.number.value = v;
        } else if (evt.target.value === "") {
            props.number.value = 0;
            setVacant(true);
        }
    }

    return (
        <foreignObject ref={ref} width={67} height={30}>
            <input type="number" placeholder="0" value={vacant ? undefined : props.number.value} onChange={setValue} />
        </foreignObject>
    )
})

export default observer(Number);