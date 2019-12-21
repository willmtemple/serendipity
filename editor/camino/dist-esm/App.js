import { __decorate } from "tslib";
import { untracked } from "mobx";
import { inject, observer } from "mobx-react";
import * as React from "react";
import withStores from "./util/withStores";
import "./App.css";
import { unwrap } from "@serendipity/syntax/dist/util/Result";
import { Interpreter } from "@serendipity/interpreter";
import { createLoweringCompiler } from "@serendipity/compiler-desugar";
import Global from "./components/syntax/global";
import { makeDraggable } from "./util/Draggable";
let App = class App extends React.Component {
    constructor(props) {
        super(props);
        this.deferredRun = false;
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
        if (!this.props.PrefsStore.prefs.terminal) {
            this.props.PrefsStore.prefs.terminal = true;
            this.deferredRun = true;
            return;
        }
        const compiler = createLoweringCompiler();
        // TODO : uncast this, provide actual compiler API
        const program = this.props.ProjectStore.canonicalProgram;
        const println = (s) => {
            this.props.PrefsStore.eventBus.dispatchEvent(new CustomEvent("data", {
                detail: { message: s + "\n\r" },
            }));
        };
        let compiled;
        try {
            compiled = unwrap(compiler.compile(program));
        }
        catch (e) {
            println("\x1B[1;31m[Compiler Error]\x1B[0m " + e.message);
            return;
        }
        const interp = new Interpreter(println);
        println("\x1B[1m[Program Starting]\x1B[0m\n");
        try {
            interp.execModule(compiled);
            println("\r\n\x1B[1;32m[Program Terminated]\x1B[0m");
        }
        catch (e) {
            println("\x1B[1;31m[Runtime Error]\x1B[0m " + e.message);
        }
    }
    componentDidMount() {
        if (this.svg.current) {
            makeDraggable(this.svg.current);
        }
    }
    componentDidUpdate() {
        if (this.deferredRun) {
            this.deferredRun = false;
            this.runProgram();
        }
    }
    render() {
        const projectStore = this.props.ProjectStore;
        return (React.createElement("div", { className: "App" },
            React.createElement("svg", { ref: this.svg, className: "blocksWorkspace", preserveAspectRatio: "xMinYMin slice", xmlns: "http://www.w3.org/2000/svg" },
                React.createElement("defs", null,
                    React.createElement("filter", { id: "f_BlockShadow" },
                        React.createElement("feOffset", { result: "offOut", in: "SourceAlpha", dx: "3", dy: "3" }),
                        React.createElement("feGaussianBlur", { result: "blurOut", in: "offOut", stdDeviation: "2" }),
                        React.createElement("feBlend", { in: "SourceGraphic", in2: "blurOut", mode: "normal" })),
                    React.createElement("filter", { id: "detachedElement" },
                        React.createElement("feColorMatrix", { in: "SourceGraphic", type: "saturate", values: "0.12" })),
                    React.createElement("filter", { id: "dropGlow" },
                        React.createElement("feFlood", { result: "flood", floodColor: "#FFFFFF", floodOpacity: 1 }),
                        React.createElement("feComposite", { in: "flood", result: "mask", in2: "SourceGraphic", operator: "in" }),
                        React.createElement("feMorphology", { in: "mask", result: "dilated", operator: "dilate", radius: "2" }),
                        React.createElement("feGaussianBlur", { in: "dilated", result: "blurred", stdDeviation: 5 }),
                        React.createElement("feMerge", null,
                            React.createElement("feMergeNode", { in: "blurred" }),
                            React.createElement("feMergeNode", { in: "SourceGraphic" }))),
                    React.createElement("pattern", { id: "bgPattern", x: 0, y: 0, width: 50, height: 50, patternUnits: "userSpaceOnUse" },
                        React.createElement("rect", { x: 0, y: 0, width: 50, height: 50, fill: "#F0F0F0" }),
                        React.createElement("circle", { cx: 25, cy: 25, r: 2, fill: "#AAAAAA" }))),
                React.createElement("rect", { id: "workspaceBackground", x: 0, y: 0, width: "140%", height: "140%", fill: "url(#bgPattern)", style: { height: "140%", width: "140%" } }),
                projectStore.program.globals.map((glb, idx) => {
                    const meta = this.props.ProjectStore.metadataFor(glb);
                    return (React.createElement("g", { key: untracked(() => meta.guid), id: meta.guid, "data-guid": meta.guid, "data-idx": idx, "data-port-compatibility": glb.globalKind === "_editor_detachedsyntax"
                            ? glb.syntaxKind
                            : undefined, className: "draggable global " + glb.globalKind, transform: untracked(() => `translate(${meta.pos.x}, ${meta.pos.y})`) },
                        React.createElement(Global, { global: glb })));
                }))));
    }
};
App = __decorate([
    inject("PrefsStore"),
    inject("ProjectStore"),
    observer
], App);
export { App };
export default withStores("PrefsStore", "ProjectStore")(App);
