// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.
//
import { SyntaxObject } from "@serendipity/syntax";

/* eslint-disable @typescript-eslint/ban-types */

export type Expression =
  | Number
  | String
  | Boolean
  | Name
  | Accessor
  | Call
  | Closure
  | Tuple
  | If
  | BinaryOp
  | Void;

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

export interface Call extends SyntaxObject {
  kind: "Call";
  callee: Expression;
  parameter?: Expression;
}

export interface Closure extends SyntaxObject {
  kind: "Closure";
  parameter?: string;
  body: Expression;
}

export interface Tuple extends SyntaxObject {
  kind: "Tuple";
  values: Expression[];
}

export interface If extends SyntaxObject {
  kind: "If";
  cond: Expression;
  then: Expression;
  _else: Expression;
}

export enum BinaryOperator {
  // Comparators
  LT = "<",
  GT = ">",
  LEQ = "<=",
  GEQ = ">=",
  EQ = "==",
  NEQ = "!=",
  // Arith
  ADD = "+",
  SUB = "-",
  DIV = "/",
  MUL = "*",
  MOD = "%"
}

export interface BinaryOp extends SyntaxObject {
  kind: "BinaryOp";
  op: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface Void extends SyntaxObject {
  kind: "Void";
}

