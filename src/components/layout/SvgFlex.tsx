import * as React from 'react';
import { ReceivedProps } from 'src/util/ReceivedProps';
import { arrayEqual } from '../../util';
import { ISizedComponent } from './SizedComponent';

// Flatten an offsets list for use with arrayEqual
function flatten(a : Offsets) : number[] {
    return a ? a.reduce<number[]>((o, v) => {
        o.push(v.p);
        o.push(v.o);
        return o;
    }, []) : [];
}

interface ISvgFlexProps {
    parent?: ISizedComponent,

    padding?: number,

    direction: "horizontal" | "vertical",
    align?: "beginning" | "middle" | "end" 
}

type Offsets = Array<{p: number, o: number}> | null;

interface ISvgFlexState {
    computedOffsets: Array<{p: number, o: number}> | null
}

class SvgFlex extends React.Component<ISvgFlexProps, ISvgFlexState>
implements ISizedComponent {
    private childRefs: Array<React.RefObject<SVGGElement>>;
    private cachedChildren: React.ReactNode[] | null;
    private inlineChildren: any[];

    private ready: boolean;
    private mustResizeOnUpdate: boolean;

    constructor(props: ISvgFlexProps) {
        super(props);
        this.state = {
            computedOffsets: null
        }
        this.childRefs = [];
        this.cachedChildren = null;
        this.inlineChildren = [];
        this.ready = false;
        this.mustResizeOnUpdate = false;

        this.cacheChildren(React.Children.toArray(this.props.children));
    }

    public componentWillReceiveProps(newProps: ReceivedProps<ISvgFlexProps>) {
        this.cacheChildren(React.Children.toArray(newProps.children));
    }

    public componentDidUpdate() {
        console.log("SvgHorizontal did update")
        if (this.mustResizeOnUpdate) {
            this.resize();
            this.mustResizeOnUpdate = false;
        } else {
            // TODO: don't need to force, should refactor
            this.props.parent!.resize();
        }
    }

    public componentDidMount() {
        console.log("SvgHorizontal did mount")
        this.ready = true;
        this.resize();
    }

    public resize() {
        if (this.ready && this.childRefs.every(r => r.current != null)) {
            // Need to compute new offsets and diff them all
            const offsets = flatten(this.state.computedOffsets);
            let accumulatedPrimaryOffset = 0;

            const padding = this.props.padding || 0;
            const axisDir = this.props.direction === "horizontal";
            // Selectors for primary vs. orthogonal axis
            const pAxis = (box : DOMRect) => axisDir ? box.width : box.height;
            const oAxis = (box : DOMRect) => axisDir ? box.height : box.width;


            const boxes = this.childRefs.map(c => c.current!.getBBox());
            // length of the orthogonal axis
            const oDim = boxes.reduce<number>((a : number, box : DOMRect) => {
                const dim = oAxis(box)
                return (dim > a) ? dim : a;
            }, 0);

            // Alignment helper function
            const needsAlignment = (this.props.align && this.props.align !== "beginning");
            const oAlign = needsAlignment ? (box: DOMRect) => {
                const o = oAxis(box);
                if (this.props.align === "middle") {
                    return (oDim - o) / 2;
                } else if (this.props.align === "end") {
                    return (oDim - o);
                } else {
                    return 0;
                }
            } : () => 0;

            const flatNewOffsets : number[] = [];
            const newOffsets = boxes.map((box) => {
                const pOffset = accumulatedPrimaryOffset;
                const nextPrimaryOffset = pAxis(box);
                const oOffset = oAlign(box);
                accumulatedPrimaryOffset += nextPrimaryOffset + padding;
                flatNewOffsets.push(pOffset);
                flatNewOffsets.push(oOffset);
                return {
                    p : pOffset,
                    o : oOffset
                };
            });
            if (!arrayEqual(offsets, flatNewOffsets)) {
                // First sizing
                console.log("SvgHorizontal will be resized!")
                this.setState({
                    computedOffsets: newOffsets
                });
            } else {
                console.log("SvgHorizontal will not be resized")
                // TODO: don't need to force, should refactor
                this.props.parent!.resize();
            }
        }
    }

    public render() {
        console.log("SvgFlex is rendering", this.props.direction, this.props.align)
        const offsets = this.state.computedOffsets;
        return (
            <g className="svg horizontal box">
                {
                    this.inlineChildren.map((child, idx) => {
                        let translation;
                        if (offsets) {
                            console.log(offsets[idx])
                            translation = (this.props.direction === "horizontal") ?
                            `translate(${offsets[idx].p},${offsets[idx].o})` :
                            `translate(${offsets[idx].o},${offsets[idx].p})`;
                        }
                        return (<g ref={this.childRefs[idx]} key={idx} transform={translation}>
                            {child}
                        </g>)
                    })
                }
            </g>
        )
    }

    private cacheChildren(newChildren: React.ReactNode[]) {
        let idx = 0;
        if (!arrayEqual(newChildren, this.cachedChildren)) {
            const newRefs : Array<React.RefObject<SVGGElement>> = [];

            this.inlineChildren = React.Children.map(
                newChildren,
                (c) => {
                    const ref = (
                        this.cachedChildren &&
                        // tslint:disable-next-line: triple-equals
                        c == this.cachedChildren[idx]
                    ) ? this.childRefs[idx++]
                        : React.createRef();

                    newRefs.push(ref as React.RefObject<SVGGElement>);

                    return React.isValidElement(c) ?
                        React.cloneElement(c, {
                            parent: this
                        } as any) :
                        c;
                });

            this.childRefs = newRefs;
            this.cachedChildren = [...newChildren];
            this.mustResizeOnUpdate = true;
        }

    }

}

export default SvgFlex;