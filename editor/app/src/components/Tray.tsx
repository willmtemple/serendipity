import { useStores } from "@serendipity/editor-stores";
import { observer } from "mobx-react";
import Terminal from "./Terminal";
import { Icon } from "./util/Icon";

function Tray() {
  const { Prefs } = useStores();

  const isOpen = Prefs.prefs.terminal;

  const toggle = () => Prefs.toggleTerminal();

  return (
    <div className="tray">
      <div className="panel">
        <ul>
          <li>
            <button onClick={toggle}>
              <Icon name="terminal" />
              &nbsp;REPL
            </button>
          </li>
        </ul>
      </div>
      {isOpen && (
        <div className="terminal" style={{ height: "22rem" }}>
          <Terminal />
        </div>
      )}
    </div>
  );
}

export default observer(Tray);
