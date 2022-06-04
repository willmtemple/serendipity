import * as React from "react";

// populate the invalidation context with a default implementation that does nothing
const ParentLayoutContext = React.createContext<() => void>(() => {
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

function same(l: Rect, r: Rect): boolean {
  return l && r && l.x === r.x && l.y === r.y && l.width === r.width && l.height === r.height;
}

const blankExtent: Rect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

type HTMLElementWithBBox = HTMLElement & { getBBox(): Rect };
type SizeableChildRef = React.RefObject<HTMLElementWithBBox> | null;

function refChildren(children: React.ReactNode) {
  const refs: SizeableChildRef[] = [];
  function ref() {
    const r = React.createRef<HTMLElementWithBBox>();
    refs.push(r);
    return r;
  }

  const newChildren = React.Children.map(React.Children.toArray(children), (c) => {
    if (React.isValidElement(c)) {
      return React.cloneElement(c, {
        ref: ref(),
      });
    } else {
      refs.push(null);
      return c;
    }
  });

  return [newChildren, refs] as const;
}

export interface MeasurementProps {
  sizes: Rect[];
}

export function measureChildren<P extends {}>(
  WrappedComponent: React.ComponentType<P & MeasurementProps>
) {
  return React.forwardRef<any, React.PropsWithChildren<P>>((props, ref) => {
    const [children, childRefs] = React.useMemo(
      () => refChildren(props.children),
      [props.children]
    );

    const [rects, setRects] = React.useState<Rect[]>(
      React.Children.map(children, () => ({ ...blankExtent }))
    );

    const resizeParent = useResizeParent();

    const extendedProps: P & MeasurementProps = {
      ...props,
      sizes: rects,
      children,
      ref,
    };

    function resize() {
      if (ready.current && childRefs.every((r) => r === null || r.current !== null)) {
        const newRects = childRefs.map((r) => r?.current?.getBBox() ?? { ...blankExtent });

        if (rects.length !== newRects.length || newRects.some((r, idx) => !same(r, rects[idx]))) {
          setRects(newRects);
        }
      }
      resizeParent();
    }

    // Update logic
    const ready = React.useRef(false);
    React.useLayoutEffect(() => {
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
