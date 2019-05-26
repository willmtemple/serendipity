import React, { Component } from 'react';
import { observer } from 'mobx-react';

@observer
class Binder extends Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        this.props.parent.resize();
    }

    onChange(evt) {
        const newName = evt.target.value;

        if (newName === '') {
            // Delete if we have a number key
            if ((typeof this.props.bindKey) === "number") {
                this.props.bind.splice(this.props.bindKey, 1);
                return;
            }
        }

        this.props.bind[this.props.bindKey] = newName;
    }

    render() {
        return (
            <foreignObject width={67} height={30}>
                <input  type="text"
                        value={this.props.bind[this.props.bindKey]}
                        onChange={this.onChange} />
            </foreignObject>
        );
    }
}

export default Binder;