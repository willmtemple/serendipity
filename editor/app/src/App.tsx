import React from "react";

import { Editor } from "@serendipity/camino";

const App: React.FC = () => {
  return (
    <div className="App">
      <div
        style={{
          width: "77%",
          height: "77%",
          backgroundColor: "magenta"
        }}
      >
        <Editor />
      </div>
    </div>
  );
};

export default App;
