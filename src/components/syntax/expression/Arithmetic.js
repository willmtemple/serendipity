import React, { Component } from 'react'
import { observer } from 'mobx-react';
import Expression from '.';
import SvgHorizontal from '../../layout/SvgHorizontal';

@observer
class Arithmetic extends Component {
    componentDidMount() {
        console.log("Arithmetic did mount")
    }
    render() {
        console.log("Arithmetic is rendering")
        return (
            <SvgHorizontal parent={this.props.parent} padding={20}>
                <Expression expression={this.props.arithmetic.left} />
                <text>{this.props.arithmetic.op}</text>
                <Expression expression={this.props.arithmetic.right} />
            </SvgHorizontal>
        )
    }
}

export default Arithmetic;