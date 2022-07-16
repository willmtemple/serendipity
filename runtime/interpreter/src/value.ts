// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Binder } from "./scope";

export type Value = NumberV | StringV | ClosV | IntrinsicV | TupleV | BoolV | VoidV;

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
    parameter: string | undefined;
  };
}

export interface IntrinsicV {
  kind: "intrinsic";
  fn(parameter?: Value): Value;
}

export interface TupleV {
  kind: "tuple";
  value: Binder[];
}

export interface BoolV {
  kind: "boolean";
  value: boolean;
}

export interface VoidV {
  kind: "void";
}
