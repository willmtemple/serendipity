import { inject, observer } from 'mobx-react';
import * as React from 'react';

import { SyntaxObject } from 'proto-syntax/dist/lib/lang/syntax';
import { ProjectStore } from 'src/stores/ProjectStore';
import withStores from 'src/util/withStores';
import { ISizedComponent } from '../layout/SizedComponent';

interface ISyntaxHoleProps {
    parent? : ISizedComponent,
    bind : SyntaxObject,
    bindKey : string | number,
    bindIdx? : number 
    
    // Injected
    ProjectStore: ProjectStore
}

@inject('ProjectStore')
@observer
class SyntaxHole extends React.Component<ISyntaxHoleProps> {
    // When a syntax hole mounts, it should trigger an upwards resize
    public componentDidMount() {
        this.props.parent!.resize()
    }
    public render() {
        const projects = this.props.ProjectStore;
        let expr = this.props.bind[this.props.bindKey];
        if (this.props.bindIdx !== undefined) {
            expr = expr[this.props.bindIdx];
        }
        return (
            <rect className="dropExpression"
                data-guid={projects.metadataFor(expr).guid}
                fill="#FFFFFFC0"
                rx={5}
                width={100}
                height={30}/>
        );
    }
}

export default withStores('ProjectStore')(SyntaxHole);