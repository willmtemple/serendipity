import * as React from "react";

import { useStores } from "@serendipity/editor-stores";

import { Terminal as XTerm } from "xterm";
import { fit } from "xterm/lib/addons/fit/fit";

import "xterm/dist/xterm.css";

export const Terminal: React.FC = () => {
  const termDiv: React.RefObject<HTMLDivElement> = React.createRef();

  const { Prefs } = useStores();

  React.useEffect(() => {
    if (termDiv.current) {
      const term = new XTerm({
        fontFamily:
          "Source Code Pro, Monaco, Menlo, Ubuntu Mono, courier-new, monospace",
        fontWeight: "600"
      });

      term.open(termDiv.current);
      fit(term);

      term.writeln("Program Terminal");
      term.writeln("");

      const handleEvent = (evt: CustomEvent<{ message: string }>) => {
        term.write(evt.detail.message + "\r\n");
      };
      Prefs.eventBus.addEventListener("data", handleEvent);

      return () => {
        Prefs.eventBus.removeEventListener("data", handleEvent);
      };
    } else {
      return () => {};
    }
  }, []);

  return <div ref={termDiv} className="terminal" />;
};

export default Terminal;
