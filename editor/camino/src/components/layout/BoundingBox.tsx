import * as React from "react";

import { MeasurementProps, measureChildren } from "../../hooks/measure";

export interface BoundingBoxProps {
  color?: string;
  transform?: string;
  title?: string;

  // Set extra props on the top-level g element
  containerProps?: any;
}

type CompleteProps = MeasurementProps & React.PropsWithChildren<BoundingBoxProps>;

export const BoundingBox = measureChildren(
  React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    return (
      <g {...props.containerProps} transform={props.transform} ref={ref}>
        <rect
          className="boundary"
          rx={8}
          width={(props.sizes[0]?.width ?? 0) + 28}
          height={(props.sizes[0]?.height ?? 0) + 28}
        />
        <g transform="translate(14,14)">{props.children}</g>
      </g>
    );
  })
);

BoundingBox.displayName = "BoundingBox";

export default BoundingBox;
