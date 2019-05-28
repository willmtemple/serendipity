import { observer } from 'mobx-react';
import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import * as React from 'react';

interface INumberProps {
    number: expression.Number
}

@observer
class Number extends React.Component<INumberProps> {
    constructor(props : INumberProps) {
        super(props);

        this.setValue = this.setValue.bind(this);
    }

    public render() {
        console.log("Number is rendering");
        return (
            <foreignObject width={67} height={30}>
                <div {...{xmlns: "http://www.w3.org/1999/xhtml"}}>
                    <input type="number" placeholder="0" value={this.props.number.value} onChange={this.setValue} />
                </div>
            </foreignObject>
        )
    }

    private setValue(evt : React.ChangeEvent<HTMLInputElement>) {
        const v = parseFloat(evt.target.value);
        if (v !== undefined && !isNaN(v)) {
            this.props.number.value = v;
        }
    }
}

export default Number;