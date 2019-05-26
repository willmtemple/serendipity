import React, { PureComponent } from 'react';

export default class BoundingBox extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            extent: null
        }
        this.bodyRef = React.createRef();
    }

    componentDidUpdate() {
        console.log("BoundingBox did update");
        this.props.parent.resize();
    }

    componentDidMount() {
        console.log("BoundingBox did mount");
        this.resize();
    }

    resize() {
        if (this.bodyRef.current) {
            const box = this.bodyRef.current.getBBox();
            const cur = this.state.extent;

            if (!cur || box.height !== cur.height || box.width !== cur.width) {
                console.log("BoundingBox will resize");
                this.setState({
                    extent: {
                        width: box.width,
                        height: box.height
                    }
                })
            }
        }
    }

    render() {
        console.log("BoundingBox is rendering")
        const children = React.Children.map(this.props.children, (c) =>
            React.cloneElement(c, {
                parent: this,
            })
        );
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
                    {children}
                </g>
            </g >
        )
    }


}