import * as React from "react";

import { MeasurementProps, measureChildren } from "../../hooks/measure";

export interface BoundingBoxProps {
  color?: string;

  // Set extra props on the top-level g element
  containerProps?: any;
}

type CompleteProps = MeasurementProps & React.PropsWithChildren<BoundingBoxProps>;

export const BoundingBox = measureChildren(
  React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    return (
      <g {...props.containerProps} ref={ref}>
        <rect
          className="boundary"
          rx={3}
          width={props.sizes[0].width + 20}
          height={props.sizes[0].height + 20}
        />
        <g transform="translate(10,10)">{props.children}</g>
      </g>
    );
  })
);

BoundingBox.displayName = "BoundingBox";

export default BoundingBox;
