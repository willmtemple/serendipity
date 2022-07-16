// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

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
  | Record
  | Procedure
  | If
  | Compare
  | Void
  | Hole;

export interface Number {
  kind: "Number";
  value: number;
}

export interface String {
  kind: "String";
  value: string;
}

export interface Boolean {
  kind: "Boolean";
  value: boolean;
}

export interface Name {
  kind: "Name";
  name: string;
}

export interface Accessor {
  kind: "Accessor";
  accessee: Expression;
  index: Expression;
}

export interface Arithmetic {
  kind: "Arithmetic";
  op: "+" | "-" | "/" | "*" | "%";
  left: Expression;
  right: Expression;
}

export interface With {
  kind: "With";
  binding: [string, Expression];
  expr: Expression;
}

export interface Call {
  kind: "Call";
  callee: Expression;
  parameters: Expression[];
}

export interface Closure {
  kind: "Closure";
  parameters: string[];
  body: Expression;
}

export interface List {
  kind: "List";
  contents: Expression[];
}

export interface Tuple {
  kind: "Tuple";
  values: Expression[];
}

export interface Record {
  kind: "Record";
  data: { [K in string]: Expression };
}

export interface Procedure {
  kind: "Procedure";
  body: Statement[];
}

export interface If {
  kind: "If";
  cond: Expression;
  then: Expression;
  _else: Expression;
}

export interface Compare {
  kind: "Compare";
  op: "<" | ">" | "<=" | ">=" | "==" | "!=";
  left: Expression;
  right: Expression;
}

export interface Void {
  kind: "Void";
}

export interface Hole {
  kind: "@hole";
}
