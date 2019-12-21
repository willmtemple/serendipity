import * as React from 'react';
// populate the invalidation context with a default implementation that does nothing
const ParentLayoutContext = React.createContext(() => { return; });
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
function same(l, r) {
    if (!l) {
        return r ? false : true;
    }
    if (!r) {
        return false;
    }
    // tslint:disable-next-line: triple-equals
    if (l == r) {
        return true;
    }
    return l.x === r.x
        && l.y === r.y
        && l.width === r.width
        && l.height === r.height;
}
const blankExtent = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};
function extend(l, n) {
    const final = [...l];
    for (let i = 0; i < n; i++) {
        if (!final[i]) {
            final[i] = { ...blankExtent };
        }
    }
    return final;
}
function refChildren(children) {
    const refs = [];
    function ref() {
        const r = React.createRef();
        refs.push(r);
        return r;
    }
    const containedChildren = React.Children.map(children, (c) => React.createElement("g", { ref: ref() }, c));
    return [containedChildren, refs];
}
export function measureChildren(WrappedComponent) {
    return React.forwardRef((props, ref) => {
        const pChildren = React.Children.toArray(props.children);
        const [children, childRefs] = React.useMemo(() => refChildren(pChildren), pChildren);
        const [rects, setRects] = React.useState([]);
        const resizeParent = useResizeParent();
        const extendedProps = {
            ...props,
            sizes: extend(rects, children.length),
            children,
            ref
        };
        function resize() {
            const canSize = childRefs.every(r => r.current !== null);
            if (ready.current && canSize) {
                const newRects = childRefs.map(r => (r.current && r.current.getBBox()));
                if (!newRects.every((r, idx) => same(r, rects[idx]))) {
                    setRects(newRects);
                }
                else {
                    resizeParent();
                }
            }
        }
        // Update logic
        const ready = React.useRef(false);
        const shouldResizeOnUpdate = React.useRef(false);
        React.useLayoutEffect(() => {
            if (ready.current) {
                shouldResizeOnUpdate.current = false;
                resize();
            }
            else {
                ready.current = true;
                resize();
            }
        });
        return (React.createElement(ParentLayoutContext.Provider, { value: resize },
            React.createElement(WrappedComponent, Object.assign({}, extendedProps, { ref: ref }))));
    });
}
