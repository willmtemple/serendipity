import { observer } from "mobx-react";
import * as React from "react";

import { Name } from "@serendipity/syntax-surface";

import { useResizeParentEffect } from "../../../hooks/measure";
import Binder from "../../editor/Binder";

const Name = React.forwardRef<any, { name: Name }>((props, ref) => {
  useResizeParentEffect();

  return <Binder ref={ref} bind={props.name} bindKey="name" />;
});

export default observer(Name);
