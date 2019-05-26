import React, { Component } from 'react';
import { arrayEqual } from '../../util';

class SvgVertical extends Component {
    constructor(props) {
        super(props);
        this.state = {
            computedOffsets: null
        }
        this.childRefs = this.props.children.map(() => React.createRef());

        this.ready = false;
    }

    componentDidUpdate() {
        console.log("SvgVertical did update")
        this.props.parent.resize();
    }

    componentDidMount() {
        console.log("SvgVertical did mount")
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
                accumulatedOffset += box.height + padding;
                return offset;
            });
            if (!offsets || !arrayEqual(offsets, newOffsets)) {
                // First sizing
                console.log("SvgVerical will be resized!")
                this.setState({
                    computedOffsets: newOffsets
                });
            } else {
                console.log("SvgVertical will not be resized!");
                this.props.parent.resize();
            }
        }
    }

    render() {
        console.log("SvgVertical is rendering")
        const children = this.props.children.map((c) =>
            React.cloneElement(c, {
                parent: this,
            })
        )
        const offsets = this.state.computedOffsets;
        return (
            <g className="svg vertical box">
                {
                    children.map((child, idx) => {
                        return (<g ref={this.childRefs[idx]} key={idx} transform={offsets && `translate(0, ${offsets[idx]})`}>
                            {child}
                        </g>)
                    })
                }
            </g>
        )
    }

}

export default SvgVertical;