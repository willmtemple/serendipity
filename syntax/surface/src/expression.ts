// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { SyntaxObject } from "@serendipity/syntax";
import { Statement } from "./statement";

export type Expression =
  | Number
  | String
  | Boolean
  | Name
  | Accessor
  | Arithmetic
  | With
  | Call
  | Closure
  | List
  | Tuple
  | Procedure
  | If
  | Compare
  | Void
  | Hole;

export interface Number extends SyntaxObject {
  kind: "Number";
  value: number;
}

export interface String extends SyntaxObject {
  kind: "String";
  value: string;
}

export interface Boolean extends SyntaxObject {
  kind: "Boolean";
  value: boolean;
}

export interface Name extends SyntaxObject {
  kind: "Name";
  name: string;
}

export interface Accessor extends SyntaxObject {
  kind: "Accessor";
  accessee: Expression;
  index: Expression;
}

export interface Arithmetic extends SyntaxObject {
  kind: "Arithmetic";
  op: "+" | "-" | "/" | "*" | "%";
  left: Expression;
  right: Expression;
}

export interface With extends SyntaxObject {
  kind: "With";
  binding: [string, Expression];
  expr: Expression;
}

export interface Call extends SyntaxObject {
  kind: "Call";
  callee: Expression;
  parameters: Expression[];
}

export interface Closure extends SyntaxObject {
  kind: "Closure";
  parameters: string[];
  body: Expression;
}

export interface List extends SyntaxObject {
  kind: "List";
  contents: Expression[];
}

export interface Tuple extends SyntaxObject {
  kind: "Tuple";
  values: Expression[];
}

export interface Procedure extends SyntaxObject {
  kind: "Procedure";
  body: Statement[];
}

export interface If extends SyntaxObject {
  kind: "If";
  cond: Expression;
  then: Expression;
  _else: Expression;
}

export interface Compare extends SyntaxObject {
  kind: "Compare";
  op: "<" | ">" | "<=" | ">=" | "==" | "!=";
  left: Expression;
  right: Expression;
}

export interface Void extends SyntaxObject {
  kind: "Void";
}

export interface Hole extends SyntaxObject {
  kind: "@hole";
}

