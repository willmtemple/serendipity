import { untracked } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

import "../styles/App.scss";

import Global from "./components/syntax/global";
import InsertDrawer from "./components/editor/InsertDrawer";
import { InteractionContext } from "./interaction";
import { makeDraggable } from "./util/Draggable";
import { useWorkspaceInteraction } from "./useWorkspaceInteraction";
import { useStores } from "@serendipity/editor-stores";

export const Workspace = observer(() => {
  const workspaceSvg = React.useRef<SVGSVGElement>(null);
  const { Project } = useStores();
  const {
    clearInsertContext,
    deleteSelected,
    dragPositions,
    eventHandlers,
    insertContext,
    interactionState,
    selected,
  } = useWorkspaceInteraction();

  React.useLayoutEffect(() => {
    const workspace = workspaceSvg.current;
    if (!workspace) return undefined;
    return makeDraggable(workspace);
  }, []);

  return (
    <div className="camino-shell">
      <svg
        ref={workspaceSvg}
        className="camino workspace"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin slice"
        {...eventHandlers}
      >
        <svg id="workspaceBackgroundContainer" preserveAspectRatio="xMinYMin slice">
          <defs>
            <pattern id="bgPattern" x={0} y={0} width={50} height={50} patternUnits="userSpaceOnUse">
              <rect className="background fill" x={0} y={0} width={50} height={50} />
              <circle className="peg" cx={25} cy={25} r={2} />
            </pattern>
          </defs>
          <rect id="workspaceBackground" x="-100000" y="-100000" width="200000" height="200000" fill="url(#bgPattern)" />
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
          <InteractionContext.Provider value={interactionState}>
            {Project.program.items.map((glb, idx) => {
              const meta = untracked(() => Project.metadataFor(glb));
              const guid = untracked(() => meta.guid);
              const { x, y } = dragPositions[guid] ?? meta.pos;
              return (
                <g
                  key={guid}
                  id={guid}
                  data-guid={guid}
                  data-detached-guid={glb.kind === "_editor_detachedsyntax" ? guid : undefined}
                  data-idx={idx}
                  data-port-compatibility={
                    glb.kind === "_editor_detachedsyntax" ? glb.syntaxKind : undefined
                  }
                  className={
                    "draggable global " +
                    (selected?.guid === guid ? "selected " : "") +
                    (glb.kind === "declaration" ? glb.declaration.value.kind : glb.kind).toLowerCase()
                  }
                  transform={`translate(${x}, ${y})`}
                >
                  <Global global={glb} />
                </g>
              );
            })}
          </InteractionContext.Provider>
        </svg>
      </svg>
      <InsertDrawer context={insertContext} onClose={clearInsertContext} />
      {selected && (
        <div className="selection-actions">
          <button onClick={deleteSelected}>Delete</button>
        </div>
      )}
    </div>
  );
});
