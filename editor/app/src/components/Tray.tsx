import React from "react";

import { resize } from "@serendipity/camino";
import { useStores } from "@serendipity/editor-stores";
import { observer } from "mobx-react";
import Terminal from "./Terminal";
import { Icon } from "./util/Icon";

function Tray() {
  const { Prefs } = useStores();

  const toggle = () => Prefs.toggleTerminal();

  React.useLayoutEffect(() => {
    resize();
  });

  return (
    <div className="tray">
      <div className="panel">
        <ul>
          <li>
            <button onClick={toggle}>
              <Icon name="terminal" />
              &nbsp;XTerm
            </button>
          </li>
        </ul>
      </div>
      {Prefs.isTerminalOpen && (
        <div className="terminal" style={{ height: "22rem" }}>
          <Terminal />
        </div>
      )}
    </div>
  );
}

export default observer(Tray);
