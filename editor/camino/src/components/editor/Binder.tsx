import { action } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { useResizeParent, useResizeParentEffect } from "../../hooks/measure";

export interface BinderProps {
  bind: any;
  bindKey: number | string;

  transform?: string;
}

const WIDTH_FACTOR = 12.9;
const WIDTH_OFFSET = 2;

function Binder(props: BinderProps, ref: React.ForwardedRef<SVGForeignObjectElement>) {
  useResizeParentEffect();

  const resize = useResizeParent();

  const value = props.bind[props.bindKey] as string;

  const [width, setWidth] = React.useState(value.length || 1);

  function _change(evt: React.ChangeEvent<HTMLInputElement>) {
    const v = evt.target.value;

    if (v === "" && typeof props.bindKey === "number") {
      props.bind.splice(props.bindKey, 1);
      return;
    }

    setWidth(v.length || 1);
    resize();

    props.bind[props.bindKey] = v;
  }

  const change = action(_change);

  return (
    <foreignObject
      ref={ref}
      className="binder"
      width={(width + 1) * WIDTH_FACTOR + WIDTH_OFFSET}
      height={30}
      transform={props.transform}
    >
      <input type="text" placeholder="_" value={props.bind[props.bindKey]} onChange={change} />
    </foreignObject>
  );
}

export default observer(React.forwardRef<SVGForeignObjectElement, BinderProps>(Binder));
