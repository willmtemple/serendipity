import { observer } from 'mobx-react';
import * as React from 'react';

interface IBinderProps {
    bind: any,
    bindKey: string | number
}

@observer
class Binder extends React.Component<IBinderProps> {
    constructor(props : IBinderProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <foreignObject width={67} height={30}>
                <input  type="text"
                        value={this.props.bind[this.props.bindKey]}
                        onChange={this.onChange} />
            </foreignObject>
        );
    }

    private onChange(evt : React.ChangeEvent<HTMLInputElement>) {
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
}

export default Binder;