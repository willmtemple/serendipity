import * as React from "react";
import { __makeTemplateObject } from "tslib";
import { Rect } from "../../hooks/measure";
import SvgFlex from "./SvgFlex";

export interface ReflowProps {
  break?: number;

  vPadding?: number;
  hPadding?: number;

  vAlign?: "middle" | "beginning" | "end";
  hAlign?: "middle" | "beginning" | "end";

  transform?: string | undefined;

  children: React.ReactElement[];
}

const DEFAULT_PROPS = {
  break: 100,

  vPadding: 12,
  hPadding: 12,

  vAlign: "beginning" as const,
  hAlign: "middle" as const,
};

interface HasBBox {
  getBBox?(): Rect;
}

const _M = new WeakMap<React.ReactElement, React.RefObject<HasBBox | null>>();
const _C = new WeakMap<React.ReactElement, React.ReactElement>();

// TODO: why did I do this? Is it better than `measureChildren`?
function useCustomMeasurements(children: React.ReactElement[]): [React.ReactNode, Rect[]] {
  const [boxes, setBoxes] = React.useState<Rect[]>([]);

  const refs: Array<React.RefObject<HasBBox | null>> = [];

  const reffed = React.Children.map(children, (c) => {
    let ref: React.RefObject<HasBBox | null>;
    let withRef: React.ReactElement;
    if (_M.has(c)) {
      ref = _M.get(c)!;
      withRef = _C.get(c)!;
    } else {
      ref = React.createRef();
      withRef = React.cloneElement(c as React.ReactElement<any>, { ref });
      _M.set(c, ref);
      _C.set(c, withRef);
    }

    refs.push(ref);

    return withRef;
  });

  React.useLayoutEffect(() => {
    setBoxes(
      refs.map((r) => r.current?.getBBox?.() ?? ({ x: 0, y: 0, height: 0, width: 0 } as Rect))
    );
  }, children);

  return [reffed, boxes];
}

export const Reflow = React.forwardRef<SVGGElement, React.PropsWithChildren<ReflowProps>>(
  (props, ref) => {
    const reflowInfo = {
      ...DEFAULT_PROPS,
      ...props,
    };

    const [children, sizes] = useCustomMeasurements(props.children);

    const width =
      sizes.reduce((acc, r) => acc + (r?.width ?? 0), 0) + (sizes.length - 1) * reflowInfo.hPadding;

    console.log("Rendering reflow:", reflowInfo.break, sizes, width, props);

    const [direction, align, padding] =
      width > reflowInfo.break
        ? ["vertical" as const, reflowInfo.vAlign, reflowInfo.vPadding]
        : ["horizontal" as const, reflowInfo.hAlign, reflowInfo.hPadding];

    return (
      <SvgFlex
        ref={ref}
        direction={direction}
        align={align}
        padding={padding}
        transform={props.transform}
        children={children}
      />
    );
  }
);

Reflow.displayName = "Reflow";

export default Reflow;
