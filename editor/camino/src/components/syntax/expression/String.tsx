import { observer } from "mobx-react";
import * as React from "react";

import { String } from "@serendipity/syntax-surface";

import { useResizeParent, useResizeParentEffect } from "../../../hooks/measure";
import { SvgFlex } from "../../layout";

const WIDTH_FACTOR = 12.9;
const WIDTH_OFFSET = 2;

// tslint:disable-next-line: variable-name ban-types
const String = React.forwardRef<SVGForeignObjectElement, { string: String }>((props, ref) => {
  useResizeParentEffect();

  const resize = useResizeParent();

  const [width, setWidth] = React.useState(props.string.value.length);

  function setValue(evt: React.ChangeEvent<HTMLInputElement>) {
    props.string.value = evt.target.value;
    setWidth(props.string.value.length);
    resize();
  }

  return (
    <SvgFlex ref={ref} direction="horizontal" padding={4}>
      <text>&ldquo;</text>
      <foreignObject width={(width + 1) * WIDTH_FACTOR + WIDTH_OFFSET} height={30}>
        <input type="text" value={props.string.value} onChange={setValue} />
      </foreignObject>
      <text>&rdquo;</text>
    </SvgFlex>
  );
});

export default observer(String);
