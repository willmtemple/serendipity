import * as React from "react";

import { Link } from "react-router-dom";

import { Prefs, Project } from "@serendipity/editor-stores";
import { Module } from "@serendipity/syntax-surface";

import { Icon } from "./util/Icon";
import { CheckedEvent } from "@serendipity/editor-stores";

async function onPlayButtonPressed() {
  if (!Prefs.isTerminalOpen) {
    Prefs.toggleTerminal();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  Prefs.eventBus.dispatchEvent(
    new CustomEvent("runProgram", {
      detail: {
        program: Project.canonicalProgram,
      },
    }) as CheckedEvent<CustomEvent<{ program: Module }>, "runProgram">
  );
}

export const Navbar = () => (
  <header className="primary">
    <h1 className="title">Serendipity</h1>
    <ul className="center mode switcher">
      <li>
        <Link to="/blocks">
          <button>
            <Icon name="puzzle-piece" />
            &nbsp;Blocks
          </button>
        </Link>
        <Link to="/text">
          <button>
            <Icon name="font" />
            &nbsp;Text
          </button>
        </Link>
      </li>
    </ul>
    <ul className="right action buttons">
      <li>
        <button onClick={onPlayButtonPressed}>
          <Icon name="play" />
        </button>
      </li>
    </ul>
  </header>
);
