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
    bindIdx? : number,

    kind: "expression" | "statement",
    
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
        let stx = this.props.bind[this.props.bindKey];
        if (this.props.bindIdx !== undefined) {
            stx = stx[this.props.bindIdx];
        }

        return (
            <rect className={"drop " + this.props.kind}
                data-parent-guid={projects.metadataFor(this.props.bind).guid}
                data-mutation-key={this.props.bindKey}
                data-mutation-idx={this.props.bindIdx}
                fill="#FFFFFFE0"
                rx={5}
                width={90}
                height={48}/>
        );
    }
}

export default withStores('ProjectStore')(SyntaxHole);