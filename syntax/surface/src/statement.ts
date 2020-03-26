// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { SyntaxObject } from "@serendipity/syntax";
import { Expression } from "./expression";

export type Statement = Print | Let | Set | If | ForIn | Forever | Do | Break | Hole;

export interface Print extends SyntaxObject {
  kind: "Print";
  value: Expression;
}

export interface Let extends SyntaxObject {
  kind: "Let";
  name: string;
  value: Expression;
}

export interface Set extends SyntaxObject {
  kind: "Set";
  name: string;
  value: Expression;
}

export interface If extends SyntaxObject {
  kind: "If";
  condition: Expression;
  body: Statement;
  _else?: Statement;
}

export interface ForIn extends SyntaxObject {
  kind: "ForIn";
  binding: string;
  value: Expression;
  body: Statement;
}

export interface Forever extends SyntaxObject {
  kind: "Forever";
  body: Statement;
}

export interface Do extends SyntaxObject {
  kind: "Do";
  body: Expression;
}

export interface Break extends SyntaxObject {
  kind: "Break";
}

export interface Hole extends SyntaxObject {
  kind: "@hole";
}

