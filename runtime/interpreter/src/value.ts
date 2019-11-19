// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Binder, Scope } from "./scope";
import { statement } from "@serendipity/syntax-abstract";

export type Value = NumberV | StringV | ClosV | TupleV | ProcV | BoolV | VoidV;

export interface NumberV {
  kind: "number";
  value: number;
}

export interface StringV {
  kind: "string";
  value: string;
}

export interface ClosV {
  kind: "closure";
  value: {
    body: Binder;
    parameter?: string;
  };
}

export interface TupleV {
  kind: "tuple";
  value: Binder[];
}

export interface ProcV {
  kind: "proc";
  body: statement.Statement[];
  scope: Scope;
}

export interface BoolV {
  kind: "boolean";
  value: boolean;
}

export interface VoidV {
  kind: "void";
}
