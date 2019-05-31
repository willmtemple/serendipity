import { inject, observer } from 'mobx-react';
import * as React from 'react';

import { App } from 'src/App';
import { ProjectStore } from 'src/stores/ProjectStore';
import withStores from 'src/util/withStores';

import { writeGlobal } from 'proto-syntax/dist/lib/printer/surface';

interface IHeaderProps {
    app: App
    ProjectStore: ProjectStore
}

@inject('ProjectStore')
@observer
class Header extends React.Component<IHeaderProps> {
    constructor(props : IHeaderProps) {
        super(props);

        this.addWithDev = this.addWithDev.bind(this);
        this.dumpSyntax = this.dumpSyntax.bind(this);
    }

    public render() {
        return (
            <div className="header" style={{ height: "8rem" }}>
                <h1>Program Editor</h1>

                <button onClick={this.props.app.reset}>Reload Example Program</button>
                <button onClick={this.props.app.runProgram}>Run</button>
                <button onClick={this.props.ProjectStore.dump.bind(this.props.ProjectStore)}>Dump AST to Console</button>
                <button onClick={this.dumpSyntax}>Print program in console</button>
                <button onClick={this.addWithDev}>Add A "With"</button>
            </div>
        )
    }

    private dumpSyntax() {
        const p = this.props.ProjectStore.canonicalProgram;

        const s = p.globals.map(writeGlobal).join('\n\n');
        console.log(s);
    }

    private addWithDev() {
        this.props.ProjectStore.addNode({
            exprKind: "with",
            binding: ["x", { exprKind: "@hole" } ],
            expr: { exprKind: "@hole" }
        })
    }
}

export default withStores('ProjectStore')(Header);