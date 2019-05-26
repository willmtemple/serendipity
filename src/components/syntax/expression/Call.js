import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '.';
import SvgVertical from '../../layout/SvgVertical';
import SvgHorizontal from '../../layout/SvgHorizontal';
import Indent from '../../layout/Indent';

@observer
class Call extends Component {
    constructor(props) {
        super(props);
        this.state = {
            targetExtents: null,
        }

        this.targetBox = React.createRef();
    }

    componentDidUpdate() {
        console.log("Call did update")
        this.props.parent.resize();
    }

    componentDidMount() {
        console.log("Call did mount.")
        this.resize();
    }


    resize() {
        if (this.targetBox.current) {
            const box = this.targetBox.current.getBBox();
            const cur = this.state.targetExtents;

            console.log(box, this.state.targetExtents);
            if (!cur || box.height !== cur.height || box.width !== cur.width) {
                console.log("Call will resize")
                this.setState({
                    targetExtents: {
                        width: box.width,
                        height: box.height
                    }
                })
            }
        }
    }

    render() {
        return (
            <SvgVertical parent={this.props.parent} padding={10}>
                <SvgHorizontal padding={20}>
                    <Expression expression={this.props.call.callee} />
                    <text>(</text>
                </SvgHorizontal>
                <Indent x={36}>
                    <SvgVertical padding={20}>
                        {this.props.call.parameters.map((p, idx) =>
                            <Expression key={idx} expression={p} />
                        )}
                    </SvgVertical>
                </Indent>
                <text>)</text>
            </SvgVertical>
        )
    }
}

export default Call;