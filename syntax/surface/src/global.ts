// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { SyntaxObject } from "@serendipity/syntax";
import { Expression } from "./expression";

export type Global = Main | Define | DefineFunction;

export interface Main extends SyntaxObject {
  kind: "Main";
  body: Expression;
}

export interface Define extends SyntaxObject {
  kind: "Define";
  name: string;
  value: Expression;
}

export interface DefineFunction extends SyntaxObject {
  kind: "DefineFunction";
  name: string;
  parameters: string[];
  body: Expression;
}

