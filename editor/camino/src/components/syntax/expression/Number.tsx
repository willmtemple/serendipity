import * as React from "react";

import { Number } from "@serendipity/syntax-surface";

import { useResizeParent, useResizeParentEffect } from "../../../hooks/measure";
import { syntax } from "../../../util/syntaxComponent";

const WIDTH_FACTOR = 12.9;
const WIDTH_OFFSET = 2;

// tslint:disable-next-line: variable-name ban-types
export default syntax<{ number: Number }>("Number", (props, ref) => {
  useResizeParentEffect();

  const resize = useResizeParent();

  // TODO: need to store vacant state in the node metadata
  const [vacant, setVacant] = React.useState(false);

  const [width, setWidth] = React.useState(props.number.value.toString().length);

  function setValue(evt: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(evt.target.value);
    if (v !== undefined && !isNaN(v)) {
      setVacant(false);
      props.number.value = v;
    } else if (evt.target.value === "") {
      props.number.value = 0;
      setVacant(true);
    }

    setWidth(props.number.value.toString().length);
    resize();
  }

  return (
    <foreignObject ref={ref} width={(width + 1) * WIDTH_FACTOR + WIDTH_OFFSET} height={30}>
      <input
        type="number"
        placeholder="0"
        value={vacant ? undefined : props.number.value}
        onChange={setValue}
      />
    </foreignObject>
  );
});
