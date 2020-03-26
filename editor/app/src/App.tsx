import React from "react";

import { Workspace } from "@serendipity/camino";
import { StoreProvider } from "@serendipity/editor-stores";

import { Navbar } from "./components/Navbar";

import "./styles/App.scss";
import Terminal from "./components/Terminal";

const App: React.FC = () => {
  return (
    <div className="editor">
      <Navbar />
      <div
        className="body"
        style={{
          backgroundColor: "magenta"
        }}
      >
        <StoreProvider>
          <Workspace />
        </StoreProvider>
      </div>
      <Terminal />
    </div>
  );
};

export default App;
