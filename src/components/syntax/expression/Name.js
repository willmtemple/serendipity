import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Binder from '../../editor/Binder';

@observer
class Name extends Component {
    render() {
        console.log("Name is rendering")
        return (
            <Binder
                parent={this.props.parent}
                bind={this.props.name}
                bindKey="name" />
        )
    }
}

export default Name;