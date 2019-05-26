import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Statement from '../statement';
import SvgVertical from '../../layout/SvgVertical';

@observer
class Procedure extends Component {
    constructor(props) {
        super(props)
        this.state = {
            bodyHeight: null
        }
        this.bodyRef = React.createRef();
    }

    componentDidUpdate() {
        console.log("Procedure did update")
        this.props.parent.resize();
    }
    
    componentDidMount() {
        console.log("Procedure did mount.")
        this.resize();
    }

    resize() {
        if (this.bodyRef.current) {
            const box = this.bodyRef.current.getBBox();
            if (box.height !== this.state.bodyHeight) {
                console.log("Procedure will be resized!")
                this.setState({
                    bodyHeight: this.bodyRef.current.getBBox().height
                });
            } else {
                this.props.parent.resize();
            }
        }
    }

    render() {
        console.log("Procedure is rendering")
        return (
            <g>
                <text>{"<proc>"} [</text>
                <g ref={this.bodyRef} transform="translate(36, 22)">
                    <SvgVertical parent={this} padding={20}>
                        {this.props.procedure.body.map((s, idx) =>
                            <Statement key={idx} statement={s} />
                        )}
                    </SvgVertical>
                </g>
                <text y={this.state.bodyHeight && this.state.bodyHeight + 22}>]</text>
            </g>
        )
    }
}

export default Procedure;