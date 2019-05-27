import React, { Component } from 'react';
import { observer } from 'mobx-react';

@observer
class Number extends Component {
    constructor(props) {
        super(props);

        this.setValue = this.setValue.bind(this);
    }

    setValue(evt) {
        const v = parseFloat(evt.target.value);
        if (v !== undefined && !isNaN(v)) {
            this.props.number.value = v;
        }
    }

    render() {
        console.log("Number is rendering");
        return (
            <foreignObject width={67} height={30}>
                <div xmlns="http://www.w3.org/1999/xhtml">
                    <input type="number" placeholder={0} value={this.props.number.value} onChange={this.setValue} />
                </div>
            </foreignObject>
        )
    }
}

export default Number;