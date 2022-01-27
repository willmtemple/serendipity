import { untracked } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

import "../styles/App.scss";

import Global from "./components/syntax/global";
import { makeDraggable } from "./util/Draggable";
import { useStores } from "@serendipity/editor-stores";
import Palette from "./components/editor/Palette";

export const Workspace = observer(() => {
  const workspaceSvg: React.RefObject<SVGSVGElement> = React.useRef(null);

  React.useLayoutEffect(() => {
    if (workspaceSvg.current) {
      makeDraggable(workspaceSvg.current);
    }
  }, []);

  const { Project } = useStores();

  return (
    <svg
      ref={workspaceSvg}
      className="camino workspace"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMin slice"
    >
      <svg id="workspaceBackgroundContainer" preserveAspectRatio="xMinYMin slice">
        <defs>
          <pattern id="bgPattern" x={0} y={0} width={50} height={50} patternUnits="userSpaceOnUse">
            <rect className="background fill" x={0} y={0} width={50} height={50} />
            <circle className="peg" cx={25} cy={25} r={2} />
          </pattern>
        </defs>
        <rect
          id="workspaceBackground"
          x="-20%"
          y="-20%"
          width="200%"
          height="200%"
          fill="url(#bgPattern)"
        />
      </svg>
      <svg id="blockSpace" preserveAspectRatio="xMinYMin slice">
        <defs>
          <filter id="detachedElement">
            <feColorMatrix in="SourceGraphic" type="saturate" values="0.80" />
          </filter>
          <filter id="dropGlow" x="-20%" y="-20%" filterUnits="userSpaceOnUse">
            <feFlood result="flood" floodColor="#FFFFFF" floodOpacity={1} />
            <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in" />
            <feMorphology in="mask" result="dilated" operator="dilate" radius="2" />
            <feGaussianBlur in="dilated" result="blurred" stdDeviation={4} />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dropShadow" filterUnits="userSpaceOnUse">
            <feOffset result="offOut" in="SourceAlpha" dx="1" dy="1" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>
        {Project.program.globals.map((glb, idx) => {
          const meta = untracked(() => Project.metadataFor(glb));
          return (
            <g
              key={untracked(() => meta.guid)}
              id={meta.guid}
              data-guid={meta.guid}
              data-idx={idx}
              data-port-compatibility={
                glb.kind === "_editor_detachedsyntax" ? glb.syntaxKind : undefined
              }
              className={"draggable global " + glb.kind.toLowerCase()}
              transform={untracked(() => `translate(${meta.pos.x}, ${meta.pos.y})`)}
            >
              <Global global={glb} />
            </g>
          );
        })}
      </svg>
      <rect x={0} y={0} width={200} height="100%" fill="#FF0000" className="drop dumpster" />
      <svg
        x="80%"
        width="20%"
        y={0}
        height="100%"
        id="palette"
        preserveAspectRatio="xMinYMin slice"
        clip="auto"
        overflow="scroll"
      >
        <rect height="100%" width="100%" fill="#00000044" />
        <Palette />
      </svg>
    </svg>
  );
});
