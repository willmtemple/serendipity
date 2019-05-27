import React, { Component } from 'react';
import { arrayEqual } from '../../util';

class SvgVertical extends Component {
    constructor(props) {
        super(props);
        this.state = {
            computedOffsets: null
        }
        this.childRefs = null;
        this.cachedChildren = null;
        this.inlineChildren = null;
        this.ready = false;
        this.mustResizeOnUpdate = false;

        this.cacheChildren(this.props.children);
    }

    cacheChildren(newChildren) {
        let idx = 0;
        if (!arrayEqual(newChildren, this.cachedChildren)) {
            const newRefs = []
            this.inlineChildren = React.Children.map(
                newChildren,
                (c) => {
                    const ref = (
                        this.cachedChildren &&
                        //eslint-disable-next-line eqeqeq
                        c == this.cachedChildren[idx]
                    ) ? this.childRefs[idx++]
                        : React.createRef();

                    newRefs.push(ref);

                    return React.cloneElement(c, {
                        parent: this
                    })
                });

            this.childRefs = newRefs;
            this.cachedChildren = [...newChildren];
            this.mustResizeOnUpdate = true;
        }

    }

    componentWillReceiveProps(newProps) {
        this.cacheChildren(newProps.children);
    }

    componentDidUpdate() {
        console.log("SvgVertical did update")
        if (this.mustResizeOnUpdate) {
            this.resize();
            this.mustResizeOnUpdate = false;
        } else {
            this.props.parent.resize();
        }
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
            console.log("vert", this.childRefs);
            const newOffsets = this.childRefs.map((c) => {
                const offset = accumulatedOffset;
                const box = c.current ? c.current.getBBox() : {height: 0};
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
        const offsets = this.state.computedOffsets;
        return (
            <g className="svg vertical box">
                {
                    this.inlineChildren.map((child, idx) => {
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