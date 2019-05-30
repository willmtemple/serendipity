import * as React from 'react';
import { ISizedComponent } from 'src/components/layout/SizedComponent';

interface IVoidProps {
    parent? : ISizedComponent
}

class Void extends React.Component<IVoidProps> {
    public componentDidMount() {
        this.props.parent!.resize();
    }
    public render() {
        return (
            <text style={{fontWeight: 900}}>void</text>
        )
    }
}

export default Void;