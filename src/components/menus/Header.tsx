import { inject, observer } from 'mobx-react';
import * as React from 'react';

import { App } from 'src/App';
import { ProjectStore } from 'src/stores/ProjectStore';
import withStores from 'src/util/withStores';

interface IHeaderProps {
    app: App
    ProjectStore: ProjectStore
}

@inject('ProjectStore')
@observer
class Header extends React.Component<IHeaderProps> {
    public render() {
        return (
            <div className="header" style={{ height: "8rem" }}>
                <h1>Program Editor</h1>

                <button onClick={this.props.app.reset}>Reload Example Program</button>
                <button onClick={this.props.app.runProgram}>Run</button>
                <button onClick={this.props.ProjectStore.dump.bind(this.props.ProjectStore)}>Dump AST to Console</button>
            </div>
        )
    }
}

export default withStores('ProjectStore')(Header);