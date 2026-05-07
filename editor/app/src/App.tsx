import React from "react";

import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import { Workspace as CaminoWorkspace } from "@serendipity/camino";
import { StoreProvider } from "@serendipity/editor-stores";

import { Navbar } from "./components/Navbar";

//import { MonacoWorkspace } from "./components/MonacoWorkspace";
import "./styles/App.scss";
import Tray from "./components/Tray";
import { MonacoWorkspace } from "./components/MonacoWorkspace";

function App() {
  return (
    <div className="serendipity-app">
      <Router>
        <Navbar />
        <StoreProvider>
          <Routes>
            <Route path="/blocks" element={<CaminoWorkspace />} />
            <Route path="/text" element={<MonacoWorkspace />} />
            <Route path="/" element={<Navigate to="/blocks" replace />} />
          </Routes>
        </StoreProvider>
      </Router>
      <Tray />
    </div>
  );
}

export default App;
