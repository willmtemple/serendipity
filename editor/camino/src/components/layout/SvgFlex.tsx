import * as React from "react";

import { ParentLayoutContext, Rect, useResizeParent } from "../../hooks/measure";
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

function finite(n: number | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function cleanRect(rect: Rect): Rect {
  return {
    x: 0,
    y: 0,
    width: finite(rect.width),
    height: finite(rect.height),
  };
}

function same(l: Rect | undefined, r: Rect | undefined): boolean {
  return (l && r && l.width === r.width && l.height === r.height) ?? false;
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
    const n = finite(oSel(rect));
    return n > max ? n : max;
  }, 0);

  const align: (rect: Rect, idx: number) => number =
    props.align === "end"
      ? (r) => oDim - oSel(r)
      : props.align === "middle"
      ? (r, idx) =>
          (oDim - finite(oSel(r))) / 2 +
          (props.direction === "horizontal" && isTextChild(children[idx])
            ? TEXT_BASELINE_OFFSET
            : 0)
      : () => 0;

  const pad = props.padding ?? 0;
  let accumulator = 0;

  return children.map((_, idx) => {
    const rect = sizes[idx] ?? blankExtent;
    let translation: string;
    if (props.direction === "horizontal") {
      translation = `translate(${finite(accumulator)},${finite(align(rect, idx))})`;
      accumulator += finite(rect.width) + pad;
    } else {
      translation = `translate(${finite(align(rect, idx))},${finite(accumulator)})`;
      accumulator += finite(rect.height) + pad;
    }
    return translation;
  });
}

const SvgFlex = React.forwardRef<SVGGElement, React.PropsWithChildren<SvgFlexProps>>(
  (props, ref) => {
    const children = React.Children.toArray(props.children);
    const refs = React.useRef<Array<SVGGElement | null>>([]);
    const [sizes, setSizes] = React.useState<Rect[]>(children.map(() => ({ ...blankExtent })));
    const resizeParent = useResizeParent();
    const sizesRef = React.useRef(sizes);
    const resizeFrame = React.useRef<number | undefined>(undefined);
    const shouldNotifyParent = React.useRef(false);

    if (refs.current.length !== children.length) {
      refs.current = children.map((_, idx) => refs.current[idx] ?? null);
    }

    React.useLayoutEffect(() => {
      sizesRef.current = sizes;
    }, [sizes]);

    React.useEffect(() => {
      return () => {
        if (resizeFrame.current !== undefined) {
          window.cancelAnimationFrame(resizeFrame.current);
        }
      };
    }, []);

    React.useLayoutEffect(() => {
      if (!shouldNotifyParent.current) return;
      shouldNotifyParent.current = false;
      resizeParent();
    }, [resizeParent, sizes]);

    const resizeNow = React.useCallback(() => {
      const nextSizes = refs.current.map((child) => {
        if (!child) return { ...blankExtent };
        const rect = alignRect(child.getBBox());
        return cleanRect(rect);
      });

      const currentSizes = sizesRef.current;
      if (
        currentSizes.length !== nextSizes.length ||
        nextSizes.some((rect, idx) => !same(rect, currentSizes[idx]))
      ) {
        sizesRef.current = nextSizes;
        shouldNotifyParent.current = true;
        setSizes(nextSizes);
      }
    }, []);

    const scheduleResize = React.useCallback(() => {
      if (resizeFrame.current !== undefined) return;
      resizeFrame.current = window.requestAnimationFrame(() => {
        resizeFrame.current = undefined;
        resizeNow();
      });
    }, [resizeNow]);

    React.useLayoutEffect(() => {
      resizeNow();
    });

    const transforms = computeLayout(sizes, children, props);

    return (
      <g className="flex" ref={ref} transform={props.transform}>
        <ParentLayoutContext.Provider value={scheduleResize}>
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
        </ParentLayoutContext.Provider>
      </g>
    );
  }
);

SvgFlex.displayName = "SvgFlex";

export default SvgFlex;
