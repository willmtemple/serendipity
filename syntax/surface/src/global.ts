// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Expression } from "./expression";

export type Global = Main | Define | DefineFunction;

export interface Main {
  kind: "Main";
  body: Expression;
}

export interface Define {
  kind: "Define";
  name: string;
  value: Expression;
}

export interface DefineFunction {
  kind: "DefineFunction";
  name: string;
  parameters: string[];
  body: Expression;
}

