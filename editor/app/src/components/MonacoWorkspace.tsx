import { observer } from "mobx-react";

import Editor from "@monaco-editor/react";

import { useStores } from "@serendipity/editor-stores";
import { printModule } from "../print";

function Workspace() {
  const { Project } = useStores();

  const text = printModule(Project.canonicalProgram);

  return (
    <div className="monaco workspace">
      <Editor defaultValue={text} onChange={() => {}} />
    </div>
  );
}

export const MonacoWorkspace = observer(Workspace);
