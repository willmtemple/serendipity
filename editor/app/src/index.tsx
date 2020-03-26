import React from "react";
import ReactDOM from "react-dom";
import "./styles/index.scss";
import * as serviceWorker from "./serviceWorker";

import App from "./App";

import { createLoweringCompiler } from "@serendipity/compiler-desugar";
import { Prefs } from "@serendipity/editor-stores";
import { Interpreter } from "@serendipity/interpreter";
import { unwrap } from "@serendipity/syntax/dist/util/Result";
import { CheckedEvent } from "@serendipity/editor-stores/dist/stores/PrefsStore";

ReactDOM.render(<App />, document.getElementById("root"));

Prefs.eventBus.addEventListener("runProgram", evt => {
  const program = evt.detail.program;

  const compiler = createLoweringCompiler();

  const compiledProgram = unwrap(compiler.compile(program));

  const interpreter = new Interpreter({
    printer: (s: string) => {
      Prefs.eventBus.dispatchEvent(
        new CustomEvent("data", {
          detail: {
            message: s
          }
        }) as CheckedEvent<CustomEvent<{ message: string }>, "data">
      );
    }
  });

  interpreter.execModule(compiledProgram);
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
