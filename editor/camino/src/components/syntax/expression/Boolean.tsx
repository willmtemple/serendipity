import { Boolean } from "@serendipity/syntax-surface";

import { useResizeParent, useResizeParentEffect } from "../../../hooks/measure";
import { syntax } from "../../../util/syntaxComponent";
import { DropDown } from "../../editor";

// tslint:disable-next-line: variable-name ban-types
export default syntax<{ bool: Boolean; transform?: string }>("Boolean", (props, ref) => {
  useResizeParentEffect();

  const resize = useResizeParent();

  function setValue(v: string) {
    props.bool.value = v === "true";
    resize();
  }

  const selected = props.bool.value ? 0 : 1;

  return (
    <DropDown
      ref={ref}
      options={["true", "false"]}
      onChange={setValue}
      selected={selected}
      transform={props.transform}
    />
  );
});
