import { Name } from "@serendipity/syntax-surface";

import { useResizeParentEffect } from "../../../hooks/measure";
import Binder from "../../editor/Binder";
import { syntax } from "../../../util/syntaxComponent";

export default syntax<{ name: Name }>("Name", (props, ref) => {
  useResizeParentEffect();

  return <Binder ref={ref} bind={props.name} bindKey="name" />;
});
