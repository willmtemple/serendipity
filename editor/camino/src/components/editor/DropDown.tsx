import { observer } from "mobx-react";
import * as React from "react";

import { useResizeParentEffect } from "../../hooks/measure";

interface DropDownProps<Opts extends string[]> {
  onChange?: (v: Opts[number]) => void;

  options: Opts;
  selected?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;

  transform?: string | undefined;
}

function DropDown<Opts extends string[]>(
  props: DropDownProps<Opts>,
  ref: React.ForwardedRef<SVGForeignObjectElement>
) {
  useResizeParentEffect();

  function stop(evt: React.MouseEvent<HTMLSelectElement>) {
    evt.stopPropagation();
  }

  function change(evt: React.ChangeEvent<HTMLSelectElement>) {
    const v = parseInt(evt.target.value, 10);

    props.onChange?.(props.options[v]!);
  }

  return (
    <foreignObject
      ref={ref}
      width={props.width ?? 67}
      height={props.height ?? 30}
      transform={props.transform}
    >
      <select value={props.selected} onChange={change} onMouseDownCapture={stop}>
        {props.options.map((o, idx) => (
          <option key={o} value={idx}>
            {o}
          </option>
        ))}
      </select>
    </foreignObject>
  );
}

export default observer(
  React.forwardRef<SVGForeignObjectElement, DropDownProps<string[]>>(DropDown)
);
