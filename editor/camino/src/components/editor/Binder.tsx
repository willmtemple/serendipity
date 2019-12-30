import { observer } from 'mobx-react';
import * as React from 'react';
import { useResizeParentEffect } from '../../hooks/measure';

interface IBinderProps {
    bind: any,
    bindKey: number | string
}

const Binder = React.forwardRef<SVGForeignObjectElement, IBinderProps>((props, ref) => {
    useResizeParentEffect();

    function change(evt: React.ChangeEvent<HTMLInputElement>) {
        const v = evt.target.value;

        if (v === '' && typeof props.bindKey === 'number') {
            props.bind.splice(props.bindKey, 1);
            return;
        }

        props.bind[props.bindKey] = v;
    }

    return (
        <foreignObject ref={ref} width={67} height={30}>
            <input type="text"
                value={props.bind[props.bindKey]}
                onChange={change} />
        </foreignObject>
    );
})

export default observer(Binder);