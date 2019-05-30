import * as React from 'react';

import { ReceivedProps } from 'src/util/ReceivedProps';
import { ISizedComponent } from './SizedComponent';

interface IBoundingBoxProps {
    parent? : ISizedComponent,

    color?: string,
    padding?: number,
    rx? : number,
    ry? : number,
    stroke?: string,
    strokeWidth?: number,

    // Set extra props on the top-level g element
    containerProps?: any,

    // TODO: This is for debugging purposes
    kind? : string
}

interface IBoundingBoxState {
    extent: {
        width: number,
        height: number
    } | null
}

export default class BoundingBox
extends React.PureComponent<IBoundingBoxProps, IBoundingBoxState>
implements ISizedComponent {
    private cachedChild: React.ReactNode;
    private inlineChild: React.ReactNode;
    private mustResizeOnUpdate: boolean;
    private bodyRef: React.RefObject<SVGGElement>;

    constructor(props: IBoundingBoxProps) {
        super(props);
        this.state = {
            extent: null
        }
        this.cachedChild = null;
        this.inlineChild = null;
        this.mustResizeOnUpdate = false;

        this.bodyRef = React.createRef();

        // Require there to be only one child
        React.Children.only(this.props.children);

        this.cacheChildren(React.Children.only(this.props.children));
    }

    public componentWillReceiveProps(newProps : ReceivedProps<IBoundingBoxProps>) {
        this.cacheChildren(React.Children.only(newProps.children));
    }

    public componentDidUpdate() {
        console.log("BoundingBox did update");
        if (this.mustResizeOnUpdate) {
            this.resize();
            this.mustResizeOnUpdate = false;
        } else {
            // TODO: I shouldn't have to force this
            this.props.parent!.resize();
        }
    }

    public componentDidMount() {
        console.log("BoundingBox did mount");
        this.resize();
    }

    public render() {
        console.log("BoundingBox is rendering")
        const pad = this.props.padding || 0;
        const extent = this.state.extent;
        return (
            <g {...this.props.containerProps}>
                {
                    extent &&
                    <rect fill={this.props.color || "black"}
                        rx={this.props.rx || 6}
                        ry={this.props.ry}
                        stroke={this.props.stroke}
                        strokeWidth={this.props.strokeWidth}
                        width={extent && (extent.width + (pad * 2))}
                        height={extent && (extent.height + (pad * 2))} />
                }
                <g ref={this.bodyRef}
                    transform={pad ? `translate(${pad}, ${pad})` : undefined}>
                    {this.inlineChild}
                </g>
            </g >
        )
    }

    public resize() {
        if (this.bodyRef.current) {
            const box = this.bodyRef.current.getBBox();
            const cur = this.state.extent;

            console.log(this.props, box, cur);

            if (!cur || box.height !== cur.height || box.width !== cur.width) {
                console.log("BoundingBox will resize");
                this.setState({
                    extent: {
                        height: box.height,
                        width: box.width
                    }
                })
            } else {
                console.log("BoundingBox will _not_ resize");
                this.props.parent!.resize();
            }
        }
    }

    private cacheChildren(newChild: any) {
        // tslint:disable-next-line: triple-equals
        if (newChild != this.cachedChild) {

            this.inlineChild = React.cloneElement(newChild, {
                parent: this
            });
            this.cachedChild = newChild;
            this.mustResizeOnUpdate = true;
        }

    }


}