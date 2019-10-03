import { observer } from 'mobx-react';
import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';

interface IDropDownProps<V> {
    callback? : (v : V) => void,

    options : Array<{label: string, value: V}>
    selected? : number
}

const DropDown = (<T extends {}>() => React.forwardRef<SVGForeignObjectElement, IDropDownProps<T>>((props, ref) => {
    useResizeParentEffect();

    function change(evt: React.ChangeEvent<HTMLSelectElement>) {
        const v = parseInt(evt.target.value, 10);

        props.callback!(props.options[v].value);
    }

    return (
        <foreignObject ref={ref} width={67} height={30}>
            <select value={props.selected} onChange={props.callback && change}>
                {props.options.map((o, i) => <option value={i}>{o.label}</option>)}
            </select>
        </foreignObject>
    );
}))()

export default observer(DropDown);