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
import { MonacoWorkspace } from "./components/MonacoWorkspace";

function App() {
  return (
    <div className="serendipity-app">
      <Router>
        <Navbar />
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
      </Router>
      <Tray />
    </div>
  );
}

export default App;
