import { inject, observer } from 'mobx-react';
import * as React from 'react';

import './App.css';

import { untracked } from 'mobx';
import { unwrap } from 'proto-syntax/dist/lib/util/Result';
import { execModule } from 'proto-syntax/dist/test/interp/eval';
import { createLoweringCompiler } from 'proto-syntax/dist/test/lower';
import Header from './components/menus/Header';
import Global from './components/syntax/global';
import { ProjectStore } from './stores/ProjectStore';
import { makeDraggable } from './util/Draggable';
import withStores from './util/withStores';

interface IAppProps {
  ProjectStore: ProjectStore;
}

@inject('ProjectStore')
@observer
export class App extends React.Component<IAppProps> {
  private svg: React.RefObject<SVGSVGElement>;
  constructor(props: any) {
    super(props);

    this.runProgram = this.runProgram.bind(this);
    this.redraw = this.redraw.bind(this);
    this.reset = this.reset.bind(this);
    this.svg = React.createRef();
  }

  public redraw() {
    this.forceUpdate();
  }

  public reset() {
    this.props.ProjectStore.reset();
  }

  public runProgram() {
    console.log("=== EXECUTING ===")
    const compiler = createLoweringCompiler();
    // TODO : uncast this, provide actual compiler API
    const p = this.props.ProjectStore.canonicalProgram;
    execModule(unwrap(compiler.compile(p)))
    console.log("=== DONE ===")
  }

  public componentDidMount() {
    if (this.svg.current) {
      makeDraggable(this.svg.current);
    }
  }

  public render() {
    const projectStore = this.props.ProjectStore;
    console.log("App is rendering");

    return (
      <div className="App">
        <Header app={this} />
        <svg  ref={this.svg}
              className="blocksWorkspace"
              style={{ width: "100%", height: "calc(100% - 8rem)" }}
              preserveAspectRatio="xMinYMin slice"
              xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="f_BlockShadow">
              <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
              <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
            <filter id="detachedElement">
              <feColorMatrix in="SourceGraphic"
                type="saturate" values="0.12"/>
            </filter>
            <filter id="dropGlow">
              <feFlood result="flood" floodColor="#FFFFFF" floodOpacity={1} />
              <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in" />
              <feMorphology in="mask" result="dilated" operator="dilate" radius="2" />
              <feGaussianBlur in="dilated" result="blurred" stdDeviation={5} />
              <feMerge>
                <feMergeNode in="blurred"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
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
                id={glb.metadata.editor.guid}
                data-guid={glb.metadata.editor.guid}
                data-idx={idx}
                className="draggable global"
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

export default withStores('ProjectStore')(App);
