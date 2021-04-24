import { useStores } from "@serendipity/editor-stores";
import { observer } from "mobx-react";
import JSONTree from "react-json-tree";

// Thank you Defman21
const theme = {
  scheme: "GitHub",
  author: "Defman21",
  base00: "#ffffff",
  base01: "#f5f5f5",
  base02: "#c8c8fa",
  base03: "#969896",
  base04: "#e8e8e8",
  base05: "#333333",
  base06: "#ffffff",
  base07: "#ffffff",
  base08: "#ed6a43",
  base09: "#0086b3",
  base0A: "#795da3",
  base0B: "#183691",
  base0C: "#183691",
  base0D: "#795da3",
  base0E: "#a71d5d",
  base0F: "#333333",
};

export const AstViewer = observer(() => {
  const { Project } = useStores();

  return (
    <div className="ast-viewer" style={{ background: "#19191a" }}>
      <JSONTree theme={theme} data={Project.canonicalProgram.globals} />
    </div>
  );
});
