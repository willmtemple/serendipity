import * as React from 'react';
import { ReceivedProps } from 'src/util/ReceivedProps';
import { arrayEqual } from '../../util';
import { ISizedComponent } from './SizedComponent';

interface ISvgFlexProps {
    parent?: ISizedComponent,

    padding?: number,

    direction: "horizontal" | "vertical"
}

interface ISvgFlexState {
    computedOffsets: number[] | null
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
            const offsets = this.state.computedOffsets;
            let accumulatedOffset = 0;
            const padding = this.props.padding || 0;
            console.log("horiz", this.childRefs);
            const newOffsets = this.childRefs.map((c) => {
                const offset = accumulatedOffset;
                const box = c.current ? c.current.getBBox() : { width: 0, height: 0 };
                const nextOffset = (this.props.direction === "horizontal") ? box.width : box.height;
                accumulatedOffset += nextOffset + padding;
                return offset;
            });
            if (!offsets || !arrayEqual(offsets, newOffsets)) {
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
        console.log("SvgHorizontal is rendering")
        const offsets = this.state.computedOffsets;
        return (
            <g className="svg horizontal box">
                {
                    this.inlineChildren.map((child, idx) => {
                        let translation;
                        if (offsets) {
                            translation = (this.props.direction === "horizontal") ?
                            `translate(${offsets[idx]},0)` :
                            `translate(0,${offsets[idx]})`;
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