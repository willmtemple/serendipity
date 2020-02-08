import { untracked } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

import "../styles/App.scss";

import Global from "./components/syntax/global";
import { makeDraggable } from "./util/Draggable";
import { useStores } from "./hooks/stores";
import WorkspaceSvgDefs from "./WorkspaceSvgDefs";

const Workspace: React.FC<{}> = () => {
  const svg: React.RefObject<SVGSVGElement> = React.useRef(null);

  React.useEffect(() => {
    if (svg.current) {
      makeDraggable(svg.current);
    }
  }, []);

  const { ProjectStore } = useStores();

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
        x={0}
        y={0}
        width="140%"
        height="140%"
        fill="url(#bgPattern)"
        style={{ height: "140%", width: "140%" }}
      />
      {ProjectStore.program.globals.map((glb, idx) => {
        const meta = ProjectStore.metadataFor(glb);
        return (
          <g
            key={untracked(() => meta.guid)}
            id={meta.guid}
            data-guid={meta.guid}
            data-idx={idx}
            data-port-compatibility={
              glb.globalKind === "_editor_detachedsyntax" ? glb.syntaxKind : undefined
            }
            className={"draggable global " + glb.globalKind}
            transform={untracked(() => `translate(${meta.pos.x}, ${meta.pos.y})`)}
          >
            <Global global={glb} />
          </g>
        );
      })}
    </svg>
  );
};

export default observer(Workspace);
