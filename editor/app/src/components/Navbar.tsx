import * as React from "react";

import { Link, useLocation } from "react-router-dom";

import { Prefs, Project } from "@serendipity/editor-stores";
import { Module } from "@serendipity/syntax-surface";

import { Icon } from "./util/Icon";
import { CheckedEvent } from "@serendipity/editor-stores";

const MODES = {
  blocks: "puzzle-piece",
  text: "font",
} as const;

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

interface ModeButtonProps {
  name: keyof typeof MODES;
  icon: string;
}

const ModeButton = (props: ModeButtonProps) => {
  const location = useLocation();
  const path = location.pathname.split("/").slice(-1)[0];

  const className = path === props.name ? "active" : undefined;

  return (
    <li>
      <Link to={`/${props.name}`}>
        <button className={className}>
          <Icon name={props.icon} />
          &nbsp; {props.name.toUpperCase()}
        </button>
      </Link>
    </li>
  );
};

export const Navbar = () => (
  <header className="primary">
    <h1 className="title">Serendipity</h1>
    <ul className="editor mode switcher">
      {Object.entries(MODES).map(([name, icon]) => (
        <ModeButton key={name} name={name as keyof typeof MODES} icon={icon} />
      ))}
    </ul>
    <ul className="right action bar">
      <li>
        <button onClick={onPlayButtonPressed}>
          <Icon name="play" />
        </button>
      </li>
    </ul>
  </header>
);
