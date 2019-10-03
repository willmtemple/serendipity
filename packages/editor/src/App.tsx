import { untracked } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import withStores from './util/withStores';

import './App.css';

import { PrefsStore } from './stores/PrefsStore';
import { ProjectStore } from './stores/ProjectStore';

import { unwrap } from 'proto-syntax/dist/lib/util/Result';
import { Interpreter } from 'proto-syntax/dist/test/interp/eval';
import { createLoweringCompiler } from 'proto-syntax/dist/test/lower';

import Navbar from './components/menus/Navbar';
import Toolbar from './components/menus/Toolbar';
import Global from './components/syntax/global';
import Terminal from './components/Terminal';
import { makeDraggable } from './util/Draggable';

interface IAppProps {
  PrefsStore: PrefsStore,
  ProjectStore: ProjectStore,
}

@inject('PrefsStore')
@inject('ProjectStore')
@observer
export class App extends React.Component<IAppProps> {
  private svg: React.RefObject<SVGSVGElement>;
  private deferredRun : boolean = false;
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
    if (!this.props.PrefsStore.prefs.terminal) {
      this.props.PrefsStore.prefs.terminal = true;
      this.deferredRun = true;
      return;
    }

    const compiler = createLoweringCompiler();
    // TODO : uncast this, provide actual compiler API
    const program = this.props.ProjectStore.canonicalProgram;
    const println = (s : string) => {
      this.props.PrefsStore.eventBus.dispatchEvent(
        new CustomEvent('data', { detail: { message: s + '\n\r' } }) as ICheckedEvent
      );
    };
    let compiled;
    try {
      compiled = unwrap(compiler.compile(program));
    } catch (e) {
      println('\x1B[1;31m[Compiler Error]\x1B[0m ' + e.message)
      return;
    }

    const interp = new Interpreter(println);
    println('\x1B[1m[Program Starting]\x1B[0m\n');
    try {
      interp.execModule(compiled);
      println('\r\n\x1B[1;32m[Program Terminated]\x1B[0m');
    } catch (e) {
      println('\x1B[1;31m[Runtime Error]\x1B[0m ' + e.message);
    }
  }

  public componentDidMount() {
    if (this.svg.current) {
      makeDraggable(this.svg.current);
    }
  }

  public componentDidUpdate() {
    if (this.deferredRun) {
      this.deferredRun = false;
      this.runProgram();
    }
  }

  public render() {
    const projectStore = this.props.ProjectStore;

    return (
      <div className="App">
        <Navbar app={this} />
        {/* <BlocksPalette /> */}
        <svg ref={this.svg}
          className="blocksWorkspace"
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
                type="saturate" values="0.12" />
            </filter>
            <filter id="dropGlow">
              <feFlood result="flood" floodColor="#FFFFFF" floodOpacity={1} />
              <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in" />
              <feMorphology in="mask" result="dilated" operator="dilate" radius="2" />
              <feGaussianBlur in="dilated" result="blurred" stdDeviation={5} />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="bgPattern" x={0} y={0} width={50} height={50}
              patternUnits="userSpaceOnUse" >
              <rect x={0} y={0} width={50} height={50} fill="#F0F0F0" />
              <circle cx={25} cy={25} r={2} fill="#AAAAAA" />
            </pattern>
          </defs>
          <rect id="workspaceBackground"
            x={0} y={0}
            width="140%" height="140%"
            fill="url(#bgPattern)"
            style={{ height: "140%", width: "140%" }} />
          {
            projectStore.program.globals.map((glb, idx) => {
              const meta = this.props.ProjectStore.metadataFor(glb);
              return <g key={untracked(() => meta.guid)}
                id={meta.guid}
                data-guid={meta.guid}
                data-idx={idx}
                data-port-compatibility={glb.globalKind === "_editor_detachedsyntax" ? glb.syntaxKind : undefined}
                className={"draggable global " + glb.globalKind}
                transform={untracked(() =>
                  `translate(${meta.pos.x}, ${meta.pos.y})`
                )}>
                <Global global={glb} />
              </g>
            })
          }
        </svg>
        {
          this.props.PrefsStore.prefs.terminal && (
            <Terminal termDivProps={{
              id: "terminal",
              style: {
                position: "absolute",
                left: 0,
                bottom: 0,
                right: 0,
                height: "30%",
                background: "black",
              }
            }} />
          )
        }
        <Toolbar app={this} />
      </div>
    );
  }
}

export default withStores('PrefsStore', 'ProjectStore')(App);
