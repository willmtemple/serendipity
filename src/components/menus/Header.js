import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

@inject('ProjectStore')
@observer
class Header extends Component {
    render() {
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

export default Header;