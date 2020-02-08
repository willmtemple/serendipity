import React from "react";

import { Workspace } from "@serendipity/camino";
import { StoreProvider } from "@serendipity/editor-stores";

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
        <StoreProvider>
          <Workspace />
        </StoreProvider>
      </div>
    </div>
  );
};

export default App;
