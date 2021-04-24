import React from "react";
import ReactDOM from "react-dom";
import "./styles/index.scss";
import * as serviceWorker from "./serviceWorker";

import chalk from "ansi-colors";

import App from "./App";

import { createLoweringCompiler } from "@serendipity/compiler-desugar";
import { Prefs } from "@serendipity/editor-stores";
import { Interpreter } from "@serendipity/interpreter";
import { CheckedEvent } from "@serendipity/editor-stores";

ReactDOM.render(<App />, document.getElementById("root"));

Prefs.eventBus.addEventListener("runProgram", (evt) => {
  const program = evt.detail.program;

  const compiler = createLoweringCompiler();

  const compiledProgram = compiler.compile(program);

  try {
    if (compiledProgram.kind !== "ok") {
      throw new Error(`Failed to compile program: ${compiledProgram.error}`);
    }

    const interpreter = new Interpreter({
      printer: (s: string) => {
        Prefs.eventBus.dispatchEvent(
          new CustomEvent("data", {
            detail: {
              message: s,
            },
          }) as CheckedEvent<CustomEvent<{ message: string }>, "data">
        );
      },
    });

    interpreter.execModule(compiledProgram.value);
  } catch (e) {
    Prefs.eventBus.dispatchEvent(
      new CustomEvent("data", {
        detail: {
          message: chalk.red(e.message),
        },
      }) as CheckedEvent<CustomEvent<{ message: string }>, "data">
    );
  }
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
