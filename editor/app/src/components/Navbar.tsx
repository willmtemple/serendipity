import * as React from "react";

import { Prefs, Project } from "@serendipity/editor-stores";
import { Module } from "@serendipity/syntax-surface";

import { Icon } from "./util/Icon";
import { CheckedEvent } from "@serendipity/editor-stores/dist/stores/PrefsStore";

function onPlayButtonPressed() {
  Prefs.eventBus.dispatchEvent(
    new CustomEvent("runProgram", {
      detail: {
        program: Project.canonicalProgram
      }
    }) as CheckedEvent<CustomEvent<{ program: Module }>, "runProgram">
  );
}

export const Navbar: React.FC = () => (
  <header>
    <h1 className="title">Serendipity</h1>
    <ul className="center mode switcher">
      <li>
        <button>
          <Icon name="puzzle-piece" />
          &nbsp;Blocks
        </button>
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
