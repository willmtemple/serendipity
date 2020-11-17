// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Expression } from "./expression";

export type Statement = Print | Let | Set | If | ForIn | Forever | Do | Break | Hole;

export interface Print {
  kind: "Print";
  value: Expression;
}

export interface Let {
  kind: "Let";
  name: string;
  value: Expression;
}

export interface Set {
  kind: "Set";
  name: string;
  value: Expression;
}

export interface If {
  kind: "If";
  condition: Expression;
  body: Statement;
  _else?: Statement;
}

export interface ForIn {
  kind: "ForIn";
  binding: string;
  value: Expression;
  body: Statement;
}

export interface Forever {
  kind: "Forever";
  body: Statement;
}

export interface Do {
  kind: "Do";
  body: Expression;
}

export interface Break {
  kind: "Break";
}

export interface Hole {
  kind: "@hole";
}

