import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.scss";

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

type OutputLevel = "info" | "success" | "error";

function writeOutput(message: string, level: OutputLevel = "info") {
  Prefs.eventBus.dispatchEvent(
    new CustomEvent("data", {
      detail: {
        level,
        message,
      },
    }) as CheckedEvent<CustomEvent<{ level: OutputLevel; message: string }>, "data">
  );
}

function toast(message: string, level: OutputLevel) {
  Prefs.eventBus.dispatchEvent(
    new CustomEvent("toast", {
      detail: {
        level,
        message,
      },
    }) as CheckedEvent<CustomEvent<{ level: OutputLevel; message: string }>, "toast">
  );
}

Prefs.eventBus.addEventListener("runProgram", (evt) => {
  const program = evt.detail.program;

  const compiler = createLoweringCompiler();

  const compiledProgram = compiler.compile(program);

  try {
    writeOutput("Running program...");

    if (compiledProgram.kind !== "ok") {
      throw new Error(`Failed to compile program: ${compiledProgram.error}`);
    }

    const interpreter = new Interpreter({
      printer: (s: string) => {
        writeOutput(s);
      },
    });

    void interpreter
      .execModule(compiledProgram.value, window.location.pathname)
      .then(() => {
        writeOutput("Program finished.", "success");
        toast("Program finished.", "success");
      })
      .catch((e) => {
        console.error(e);
        writeOutput((e as Error).message, "error");
        toast("Program failed.", "error");
      });
  } catch (e) {
    console.error(e);
    writeOutput((e as Error).message, "error");
    toast("Program failed.", "error");
  }
});
