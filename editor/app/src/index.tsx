import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.scss";

import chalk from "ansi-colors";

import App from "./App";

import { createLoweringCompiler } from "@serendipity/compiler-desugar";
import { Prefs } from "@serendipity/editor-stores";
import { Interpreter } from "@serendipity/interpreter";
import { CheckedEvent } from "@serendipity/editor-stores";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Unable to find #root element");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

function writeTerminal(message: string) {
  console.info("Serendipity terminal:", message);
  Prefs.eventBus.dispatchEvent(
    new CustomEvent("data", {
      detail: {
        message,
      },
    }) as CheckedEvent<CustomEvent<{ message: string }>, "data">
  );
}

Prefs.eventBus.addEventListener("runProgram", (evt) => {
  console.info("Serendipity run event received", evt.detail.program);
  const program = evt.detail.program;

  const compiler = createLoweringCompiler();

  const compiledProgram = compiler.compile(program);

  try {
    writeTerminal(chalk.cyan("Running program..."));

    if (compiledProgram.kind !== "ok") {
      throw new Error(`Failed to compile program: ${compiledProgram.error}`);
    }

    const interpreter = new Interpreter({
      printer: (s: string) => {
        writeTerminal(s);
      },
    });

    void interpreter
      .execModule(compiledProgram.value, window.location.pathname)
      .then(() => writeTerminal(chalk.green("Program finished.")))
      .catch((e) => {
        console.error(e);
        writeTerminal(chalk.red((e as Error).message));
      });
  } catch (e) {
    console.error(e);
    writeTerminal(chalk.red((e as Error).message));
  }
});
