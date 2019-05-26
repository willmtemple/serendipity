import React, { Component } from 'react';
import { arrayEqual } from '../../util';

class SvgHorizontal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            computedOffsets: null
        }
        this.childRefs = this.props.children.map((_) => React.createRef());

        this.ready = false;
    }

    componentDidUpdate() {
        console.log("SvgHorizontal did update")
        this.props.parent.resize();
    }

    componentDidMount() {
        console.log("SvgHorizontal did mount")
        this.ready = true;
        this.resize();
    }

    resize() {
        if (this.ready) {
            // Need to compute new offsets and diff them all
            const offsets = this.state.computedOffsets;
            let accumulatedOffset = 0;
            const padding = this.props.padding || 0;
            const newOffsets = this.childRefs.map((c) => {
                const offset = accumulatedOffset;
                const box = c.current.getBBox();
                accumulatedOffset += box.width + padding;
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
                this.props.parent.resize();
            }
        }
    }

    render() {
        console.log("SvgHorizontal is rendering")
        const children = this.props.children.map((c) =>
            React.cloneElement(c, {
                parent: this,
            })
        )
        const offsets = this.state.computedOffsets;
        return (
            <g className="svg horizontal box">
                {
                    children.map((child, idx) => {
                        return (<g ref={this.childRefs[idx]} key={idx} transform={offsets && `translate(${offsets[idx]}, 0)`}>
                            {child}
                        </g>)
                    })
                }
            </g>
        )
    }

}

export default SvgHorizontal;