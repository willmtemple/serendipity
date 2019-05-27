import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import './App.css';

import { createLoweringCompiler } from 'proto-syntax/dist/test/lower';
import { execModule } from 'proto-syntax/dist/test/interp/eval';
import { unwrap } from 'proto-syntax/dist/lib/util/Result';
import Global from './components/syntax/global';
import { makeDraggable } from './util/Draggable';
import { untracked } from 'mobx';
import Header from './components/menus/Header';

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
        <Header app={this} />
        <svg  ref={this.svg}
              className="blocksWorkspace"
              style={{ width: "100%", height: "calc(100% - 8rem)" }}
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="f_BlockShadow">
              <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
              <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
            <pattern  id="bgPattern" x={0} y={0} width={50} height={50}
                      patternUnits="userSpaceOnUse" >
              <rect x={0} y={0} width={50} height={50} fill="#F0F0F0" />
              <circle cx={25} cy={25} r={2} fill="#AAAAAA" />
            </pattern>
          </defs>
          <rect id="workspaceBackground"
                x={0} y={0}
                width="140%" height="140%"
                fill="url(#bgPattern)"
                style={{height: "140%", width: "140%"}}/>
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
