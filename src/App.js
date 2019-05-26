import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import './App.css';

import { createLoweringCompiler } from 'proto-syntax/dist/test/lower';
import { execModule } from 'proto-syntax/dist/test/interp/eval';
import { unwrap } from 'proto-syntax/dist/lib/util/Result';
import Global from './components/syntax/global';
import { makeDraggable } from './util/Draggable';
import { untracked } from 'mobx';

@inject('ProjectStore')
@observer
class App extends Component {
  constructor(props) {
    super(props);

    this.runProgram = this.runProgram.bind(this);
    this.redraw = this.redraw.bind(this);
    this.reset = this.reset.bind(this);
    this.svg = React.createRef();
  }

  redraw() {
    this.forceUpdate();
  }

  reset() {
    this.props.ProjectStore.reset();
  }

  runProgram() {
    console.log("=== EXECUTING ===")
    const compiler = createLoweringCompiler();
    execModule(unwrap(compiler.compile(this.props.ProjectStore.program)))
    console.log("=== DONE ===")
  }

  componentDidMount() {
    if (this.svg.current) {
      makeDraggable(this.svg.current);
    }
  }


  render() {
    const projectStore = this.props.ProjectStore;
    console.log("App is rendering");

    return (
      <div className="App">
        <div className="header" style={{ height: "8rem" }}>
          <h1>Program Editor</h1>

          <button onClick={this.reset}>Reload Example Program</button>
          <button onClick={this.runProgram}>Run</button>
          <button onClick={() => this.forceUpdate()}>Redraw</button>
          <button onClick={this.props.ProjectStore.dump.bind(this.props.ProjectStore)}>Dump AST to Console</button>
        </div>

        <svg ref={this.svg} className="blocksWorkspace" style={{ width: "100%", height: "calc(100% - 8rem)" }} xmlns="http://www.w3.org/2000/svg">
          <filter id="f_BlockShadow">
            <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
          {
            projectStore.program.globals.map((glb, idx) => (
              <g key={untracked(() => glb.metadata.editor.guid)}
                data-guid={untracked(() => glb.metadata.editor.guid)}
                data-idx={idx}
                className="global draggable"
                transform={untracked(() =>
                  `translate(${glb.metadata.editor.pos.x}, ${glb.metadata.editor.pos.y})`
                )}>
                <Global global={glb} />
              </g>
            ))
          }
        </svg>
      </div>
    );
  }
}

export default App;
