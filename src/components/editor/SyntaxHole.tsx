import { inject, observer } from 'mobx-react';
import * as React from 'react';

import { Expression } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import { ProjectStore } from 'src/stores/ProjectStore';
import withStores from 'src/util/withStores';

interface ISyntaxHoleProps {
    binder : Expression
    
    // Injected
    ProjectStore: ProjectStore
}

@observer
@inject('ProjectStore')
class SyntaxHole extends React.Component<ISyntaxHoleProps> {
    public render() {
        const projects = this.props.ProjectStore;
        return (
            <rect className="dropExpression"
                data-guid={projects.metadataFor(this.props.binder).guid}
                fill="#FFFFFFC0"
                rx={5} />
        );
    }
}

export default withStores('ProjectStore')(SyntaxHole);