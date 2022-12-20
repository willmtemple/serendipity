import { observer } from "mobx-react";

import Editor from "@monaco-editor/react";

import { useStores } from "@serendipity/editor-stores";
import { printModule } from "../print";
import { Icon } from "./util/Icon";

function Workspace() {
  const { Project } = useStores();

  const text = printModule(Project.canonicalProgram);

  return (
    <div className="monaco workspace">
      <div
        className="warning"
        style={{
          backgroundColor: "var(--warning)",
          width: "100%",
          padding: "0.5em 1em 0.5em 1em",
        }}
      >
        <Icon name="exclamation-triangle" />
        &nbsp; The program text is currently informational only. Edits will be
        discarded. Running the program will not reflect changes to the text.
      </div>
      <Editor defaultValue={text} onChange={() => {}} />
    </div>
  );
}

export const MonacoWorkspace = observer(Workspace);
