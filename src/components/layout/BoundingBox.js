import React, { PureComponent } from 'react';

export default class BoundingBox extends PureComponent {
    constructor(props) {
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

        this.cacheChildren(this.props.children);
    }

    cacheChildren(newChild) {
        //eslint-disable-next-line eqeqeq
        if (newChild != this.cachedChild) {

            this.inlineChild = React.cloneElement(newChild, {
                parent: this
            });
            this.cachedChild = newChild;
            this.mustResizeOnUpdate = true;
        }

    }

    componentWillReceiveProps(newProps) {
        this.cacheChildren(React.Children.only(newProps.children));
    }

    componentDidUpdate() {
        console.log("BoundingBox did update");
        if (this.mustResizeOnUpdate) {
            this.resize();
            this.mustResizeOnUpdate = false;
        } else {
            this.props.parent.resize();
        }
    }

    componentDidMount() {
        console.log("BoundingBox did mount");
        this.resize();
    }

    resize() {
        if (this.bodyRef.current) {
            const box = this.bodyRef.current.getBBox();
            const cur = this.state.extent;

            console.log(this.props, box, cur);

            if (!cur || box.height !== cur.height || box.width !== cur.width) {
                console.log("BoundingBox will resize");
                this.setState({
                    extent: {
                        width: box.width,
                        height: box.height
                    }
                })
            } else {
                console.log("BoundingBox will _not_ resize");
            }
        }
    }

    render() {
        console.log("BoundingBox is rendering")
        const pad = this.props.padding || 0;
        const extent = this.state.extent;
        return (
            <g ref={this.props.sizeRef} >
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
                    transform={pad && `translate(${pad}, ${pad})`}>
                    {this.inlineChild}
                </g>
            </g >
        )
    }


}