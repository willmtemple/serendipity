import * as React from "react";

import { useResizeParentEffect } from "../../../hooks/measure";

const Void = React.forwardRef<SVGTextElement>((_, ref) => {
  useResizeParentEffect();

  return (
    <text ref={ref} transform="translate(0,4)">
      none
    </text>
  );
});

Void.displayName = "Void";

export default Void;
