import React from "react";

import { Prefs } from "@serendipity/editor-stores";
import { observer } from "mobx-react";

type OutputLevel = "info" | "success" | "error";

interface OutputEntry {
  id: number;
  level: OutputLevel;
  message: string;
}

export const OutputPanel = observer(() => {
  const [entries, setEntries] = React.useState<OutputEntry[]>([]);

  React.useEffect(() => {
    let id = 0;
    const onData = (evt: CustomEvent<{ level?: OutputLevel; message: string }>) => {
      setEntries((existing) => [
        ...existing,
        {
          id: ++id,
          level: evt.detail.level ?? "info",
          message: evt.detail.message,
        },
      ]);
      Prefs.setOutputPanel(true);
    };

    Prefs.eventBus.addEventListener("data", onData);
    return () => Prefs.eventBus.removeEventListener("data", onData);
  }, []);

  return (
    <section className={"output-panel " + (Prefs.isOutputPanelOpen ? "expanded" : "collapsed")} aria-label="Program output">
      <header>
        <strong>Output</strong>
        <div className="actions">
          {Prefs.isOutputPanelOpen && <button onClick={() => setEntries([])}>Clear</button>}
          <button onClick={() => Prefs.toggleOutputPanel()}>{Prefs.isOutputPanelOpen ? "Collapse" : "Expand"}</button>
        </div>
      </header>
      {Prefs.isOutputPanelOpen && (
        <ol>
          {entries.length === 0 ? (
            <li className="empty">No output yet.</li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id} className={entry.level}>
                {entry.message}
              </li>
            ))
          )}
        </ol>
      )}
    </section>
  );
});

export default OutputPanel;
