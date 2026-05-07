import * as React from "react";

import { Rect } from "../../hooks/measure";
import { alignRect } from "../../util/quantum";

export interface SvgFlexProps {
  align?: "beginning" | "middle" | "end";
  direction: "horizontal" | "vertical";
  padding?: number;
  transform?: string | undefined;
}

const blankExtent: Rect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

const TEXT_BASELINE_OFFSET = 5;

function same(l: Rect | undefined, r: Rect | undefined): boolean {
  return (
    (l && r && l.x === r.x && l.y === r.y && l.width === r.width && l.height === r.height) ?? false
  );
}

function isTextChild(child: React.ReactNode): boolean {
  return React.isValidElement(child) && child.type === "text";
}

function computeLayout(
  sizes: Rect[],
  children: React.ReactNode[],
  props: SvgFlexProps
): string[] {
  const oSel: (r: Rect) => number =
    props.direction === "horizontal" ? (r) => r.height : (r) => r.width;

  const oDim = sizes.reduce((max, rect) => {
    const n = oSel(rect);
    return n > max ? n : max;
  }, 0);

  const align: (rect: Rect, idx: number) => number =
    props.align === "end"
      ? (r) => oDim - oSel(r)
      : props.align === "middle"
      ? (r, idx) =>
          (oDim - oSel(r)) / 2 +
          (props.direction === "horizontal" && isTextChild(children[idx])
            ? TEXT_BASELINE_OFFSET
            : 0)
      : () => 0;

  const pad = props.padding ?? 0;
  let accumulator = 0;

  return sizes.map((rect, idx) => {
    let translation: string;
    if (props.direction === "horizontal") {
      translation = `translate(${accumulator},${align(rect, idx)})`;
      accumulator += rect.width + pad;
    } else {
      translation = `translate(${align(rect, idx)},${accumulator})`;
      accumulator += rect.height + pad;
    }
    return translation;
  });
}

const SvgFlex = React.forwardRef<SVGGElement, React.PropsWithChildren<SvgFlexProps>>(
  (props, ref) => {
    const children = React.Children.toArray(props.children);
    const refs = React.useRef<Array<SVGGElement | null>>([]);
    const [sizes, setSizes] = React.useState<Rect[]>(children.map(() => ({ ...blankExtent })));

    if (refs.current.length !== children.length) {
      refs.current = children.map((_, idx) => refs.current[idx] ?? null);
    }

    React.useLayoutEffect(() => {
      const nextSizes = refs.current.map((child) => {
        if (!child) return { ...blankExtent };
        return alignRect(child.getBBox());
      });

      if (sizes.length !== nextSizes.length || nextSizes.some((rect, idx) => !same(rect, sizes[idx]))) {
        setSizes(nextSizes);
      }
    });

    const transforms = computeLayout(sizes, children, props);

    return (
      <g className="flex" ref={ref} transform={props.transform}>
        {children.map((child, idx) => (
          <g
            key={(React.isValidElement(child) && child.key) || idx}
            ref={(element) => {
              refs.current[idx] = element;
            }}
            transform={transforms[idx]}
          >
            {child}
          </g>
        ))}
      </g>
    );
  }
);

SvgFlex.displayName = "SvgFlex";

export default SvgFlex;
