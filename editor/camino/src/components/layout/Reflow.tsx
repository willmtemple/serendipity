import * as React from "react";
import { ParentLayoutContext, Rect, useResizeParent } from "../../hooks/measure";
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

function finite(n: number | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function cleanRect(rect: Rect): Rect {
  return {
    x: finite(rect.x),
    y: finite(rect.y),
    width: finite(rect.width),
    height: finite(rect.height),
  };
}

function same(l: Rect | undefined, r: Rect | undefined): boolean {
  return (
    (l && r && l.x === r.x && l.y === r.y && l.width === r.width && l.height === r.height) ?? false
  );
}

// TODO: why did I do this? Is it better than `measureChildren`?
function useCustomMeasurements(
  children: React.ReactElement[],
  resizeParent: () => void
): [React.ReactNode, Rect[], () => void] {
  const [boxes, setBoxes] = React.useState<Rect[]>([]);
  const boxesRef = React.useRef(boxes);
  const notifyFrame = React.useRef<number | undefined>(undefined);
  const shouldNotifyParent = React.useRef(false);

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
    boxesRef.current = boxes;
  }, [boxes]);

  React.useEffect(() => {
    return () => {
      if (notifyFrame.current !== undefined) {
        window.cancelAnimationFrame(notifyFrame.current);
      }
    };
  }, []);

  const notifyParent = React.useCallback(() => {
    if (notifyFrame.current !== undefined) return;
    notifyFrame.current = window.requestAnimationFrame(() => {
      notifyFrame.current = undefined;
      resizeParent();
    });
  }, [resizeParent]);

  React.useEffect(() => {
    if (!shouldNotifyParent.current) return;
    shouldNotifyParent.current = false;
    notifyParent();
  }, [boxes, notifyParent]);

  function measure() {
    const nextBoxes = refs.map((r) =>
      cleanRect(r.current?.getBBox?.() ?? ({ x: 0, y: 0, height: 0, width: 0 } as Rect))
    );
    const currentBoxes = boxesRef.current;
    if (
      currentBoxes.length !== nextBoxes.length ||
      nextBoxes.some((box, idx) => !same(box, currentBoxes[idx]))
    ) {
      boxesRef.current = nextBoxes;
      shouldNotifyParent.current = true;
      setBoxes(nextBoxes);
    }
  }

  React.useLayoutEffect(() => {
    measure();
  });

  return [reffed, boxes, measure];
}

export const Reflow = React.forwardRef<SVGGElement, React.PropsWithChildren<ReflowProps>>(
  (props, ref) => {
    const reflowInfo = {
      ...DEFAULT_PROPS,
      ...props,
    };

    const resizeParent = useResizeParent();
    const [children, sizes, measure] = useCustomMeasurements(props.children, resizeParent);

    const width =
      sizes.reduce((acc, r) => acc + (r?.width ?? 0), 0) + (sizes.length - 1) * reflowInfo.hPadding;

    const [direction, align, padding] =
      width > reflowInfo.break
        ? ["vertical" as const, reflowInfo.vAlign, reflowInfo.vPadding]
        : ["horizontal" as const, reflowInfo.hAlign, reflowInfo.hPadding];

    return (
      <ParentLayoutContext.Provider value={measure}>
        <SvgFlex
          ref={ref}
          direction={direction}
          align={align}
          padding={padding}
          transform={props.transform}
          children={children}
        />
      </ParentLayoutContext.Provider>
    );
  }
);

Reflow.displayName = "Reflow";

export default Reflow;
