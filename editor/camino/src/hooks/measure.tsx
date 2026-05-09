import * as React from "react";
import { alignRect } from "../util/quantum";

// populate the invalidation context with a default implementation that does nothing
export const ParentLayoutContext = React.createContext<() => void>(() => {
  return;
});

/**
 * React hook to get a handle to a measurement invalidator
 */
export function useResizeParent() {
  return React.useContext(ParentLayoutContext);
}

export function useResizeParentEffect() {
  const resizeParent = useResizeParent();

  const once = React.useRef(true);
  React.useLayoutEffect(() => {
    if (once.current) {
      once.current = false;
      resizeParent();
    }
  });
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function same(l: Rect | undefined, r: Rect | undefined): boolean {
  return (
    (l && r && l.x === r.x && l.y === r.y && l.width === r.width && l.height === r.height) ?? false
  );
}

const blankExtent: Rect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

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

type HTMLElementWithBBox = HTMLElement & { getBBox(): Rect };
type SizeableChildRef = React.RefObject<HTMLElementWithBBox | null> | null;

function refChildren(children: React.ReactNode, debug: boolean = false) {
  debug && console.log("Reffing all:", children);
  const refs: SizeableChildRef[] = [];
  function ref() {
    const r = React.createRef<HTMLElementWithBBox>();
    refs.push(r);
    return r;
  }

  const newChildren = React.Children.map(React.Children.toArray(children), (c) => {
    if (React.isValidElement(c)) {
      debug && console.log("Valid element:", c);
      const existingRef = (c as unknown as { ref: React.RefObject<HTMLElementWithBBox | null> }).ref;

      if (existingRef) {
        refs.push(existingRef);
      }
      return React.cloneElement(c as React.ReactElement<any>, {
        ref: existingRef ?? ref(),
      });
    } else {
      refs.push(null);
      return c;
    }
  });

  debug && console.log("Finalized refs:", newChildren, refs);

  return [newChildren, refs] as const;
}

export interface MeasurementProps {
  sizes: Rect[];
}

export function measureChildren<P extends {}>(
  WrappedComponent: React.ComponentType<P & MeasurementProps>,
  debug: boolean = false,
  componentName?: string
) {
  return React.forwardRef<any, React.PropsWithChildren<P>>((props, ref) => {
    const [children, childRefs] = React.useMemo(
      () => refChildren(props.children, debug),
      [props.children]
    );

    const [rects, setRects] = React.useState<Rect[]>(
      React.Children.map(children, () => ({ ...blankExtent }))
    );

    const resizeParent = useResizeParent();
    const rectsRef = React.useRef(rects);
    const shouldNotifyParent = React.useRef(false);

    React.useLayoutEffect(() => {
      rectsRef.current = rects;
    }, [rects]);

    React.useLayoutEffect(() => {
      if (!shouldNotifyParent.current) return;
      shouldNotifyParent.current = false;
      resizeParent();
    }, [resizeParent, rects]);

    const extendedProps = {
      ...props,
      sizes: rects,
      children,
      ref,
    } as unknown as P & MeasurementProps;

    debug && console.log("Children (Render):", props.children, childRefs, componentName);

    function resize() {
      debug &&
        console.log(
          "Attempting to resize!",
          childRefs.map((r) => r?.current),
          componentName
      );
      if (ready.current && childRefs.every((r) => r === null || r.current !== null)) {
        const _newRects = childRefs.map((r) => r?.current?.getBBox() ?? { ...blankExtent });
        const newRects = _newRects.map((rect) => cleanRect(alignRect(rect)));

        debug &&
          console.log(
            "Children (Resize):",
            props.children,
            childRefs.map((r) => r!.current),
            newRects,
            _newRects,
            componentName
          );

        const currentRects = rectsRef.current;
        if (
          currentRects.length !== newRects.length ||
          newRects.some((r, idx) => !same(r, currentRects[idx]))
        ) {
          rectsRef.current = newRects;
          shouldNotifyParent.current = true;
          setRects(newRects);
        }
      }
    }

    // Update logic
    const ready = React.useRef(false);
    React.useLayoutEffect(() => {
      debug && console.log("Layout effect firing.", componentName);
      if (!ready.current) {
        ready.current = true;
      }
      resize();
    });

    return (
      <ParentLayoutContext.Provider value={resize}>
        <WrappedComponent {...extendedProps} />
      </ParentLayoutContext.Provider>
    );
  });
}
