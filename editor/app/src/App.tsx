import React from "react";

import {
  Redirect,
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

import { Workspace as CaminoWorkspace } from "@serendipity/camino";
import { StoreProvider } from "@serendipity/editor-stores";

import { Navbar } from "./components/Navbar";

//import { MonacoWorkspace } from "./components/MonacoWorkspace";
import "./styles/App.scss";
import Tray from "./components/Tray";
import { AstViewer } from "./components/AstViewer";
import { MonacoWorkspace } from "./components/MonacoWorkspace";

function App() {
  return (
    <div className="serendipity-app">
      <Router>
        <Navbar />
        <div
          className="workspace"
          style={{
            backgroundColor: "magenta",
          }}
        >
          <StoreProvider>
            <Switch>
              <Route path="/blocks">
                <CaminoWorkspace />
              </Route>
              <Route path="/text">
                <MonacoWorkspace />
              </Route>
              <Route exact path="/">
                <Redirect to="/blocks" />
              </Route>
            </Switch>
          </StoreProvider>
        </div>
      </Router>
      <Tray />
    </div>
  );
}

export default App;
