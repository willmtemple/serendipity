import React, { Component } from 'react';

class Void extends Component {
    componentDidMount() {
        this.props.parent.resize();
    }
    render() {
        return (
            <text style={{fontWeight: 900}}>void</text>
        )
    }
}

export default Void;