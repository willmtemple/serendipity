import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import Binder from '../../editor/Binder';

interface INameProps {
    parent? : ISizedComponent,

    name: expression.Name
}

@observer
class Name extends React.Component<INameProps> {
    public render() {
        console.log("Name is rendering")
        return (
            <Binder
                bind={this.props.name}
                bindKey="name" />
        )
    }
}

export default Name;