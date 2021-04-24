import * as React from "react";

import { MeasurementProps, Rect, measureChildren } from "../../hooks/measure";

export interface SvgFlexProps {
  align?: "beginning" | "middle" | "end";
  direction: "horizontal" | "vertical";
  padding?: number;
  transform?: string;
  children: React.ReactElement<{ transform: string }> | React.ReactElement<{ transform: string }>[];
}

type CompleteProps = MeasurementProps & SvgFlexProps;

const TEXT_BASELINE_OFFSET = 5;

const SvgFlex = measureChildren(
  React.forwardRef<SVGGElement, CompleteProps>((props, ref) => {
    // Compute size along orthogonal axis
    const oSel: (r: Rect) => number =
      props.direction === "horizontal" ? (r) => r.height : (r) => r.width;

    const oDim = props.sizes.reduce((max, rect) => {
      const n = oSel(rect);
      return n > max ? n : max;
    }, 0);

    // Alignment helper function
    const _align: (rect: Rect) => number =
      props.align === "end"
        ? (r) => oDim - oSel(r)
        : props.align === "middle"
        ? (r) => (oDim - oSel(r)) / 2
        : () => 0;

    const pad = props.padding || 0;

    return (
      <g className="flex" ref={ref} transform={props.transform}>
        {(() => {
          let accumulator = 0;
          return React.Children.map(props.children, (c, idx) => {
            let translation;

            const align =
              props.direction === "horizontal" && React.isValidElement(c) && c.type === "text"
                ? // This is needed because SVG text aligns strangely. We manually correc the
                  // baseline of text children in the SvgFlex to match the baseline of inline
                  // input expr blocks
                  (rect: Rect) => _align(rect) + TEXT_BASELINE_OFFSET
                : _align;

            const rect = props.sizes[idx];
            if (props.direction === "horizontal") {
              translation = `translate(${accumulator},${align(rect)})`;
              accumulator += rect.width + pad;
            } else {
              // "vertical"
              translation = `translate(${align(rect)},${accumulator})`;
              accumulator += rect.height + pad;
            }

            return React.cloneElement(c as JSX.Element, {
              transform: translation,
            });
          });
        })()}
      </g>
    );
  })
);

export default SvgFlex;
