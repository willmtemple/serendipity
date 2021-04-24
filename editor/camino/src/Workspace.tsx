import { untracked } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

import "../styles/App.scss";

import Global from "./components/syntax/global";
import { makeDraggable } from "./util/Draggable";
import { useStores } from "@serendipity/editor-stores";
import WorkspaceSvgDefs from "./WorkspaceSvgDefs";

export const Workspace = observer(() => {
  const svg: React.RefObject<SVGSVGElement> = React.useRef(null);

  React.useEffect(() => {
    if (svg.current) {
      makeDraggable(svg.current);
    }
  }, []);

  const { Project } = useStores();

  return (
    <svg
      ref={svg}
      className="caminoWorkspace"
      preserveAspectRatio="xMinYMin slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <WorkspaceSvgDefs />
      <rect
        id="workspaceBackground"
        x="-20%"
        y="-20%"
        width="200%"
        height="200%"
        fill="url(#bgPattern)"
      />
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
            className={"draggable global " + glb.kind}
            transform={untracked(() => `translate(${meta.pos.x}, ${meta.pos.y})`)}
          >
            <Global global={glb} />
          </g>
        );
      })}
    </svg>
  );
});
