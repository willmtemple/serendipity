// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Fn } from "@serendipity/syntax/dist/util/FuncTools";
import { SyntaxObject } from "@serendipity/syntax";
import { Statement } from "./statement";

/* eslint-disable @typescript-eslint/ban-types */

export type Expression =
  | Number
  | String
  | Name
  | Accessor
  | Call
  | Closure
  | Tuple
  | Procedure
  | If
  | BinaryOp
  | Void;

export interface Number extends SyntaxObject {
  exprKind: "number";
  value: number;
}

export interface String extends SyntaxObject {
  exprKind: "string";
  value: string;
}

export interface Name extends SyntaxObject {
  exprKind: "name";
  name: string;
}

export interface Accessor extends SyntaxObject {
  exprKind: "accessor";
  accessee: Expression;
  index: Expression;
}

export interface Call extends SyntaxObject {
  exprKind: "call";
  callee: Expression;
  parameter?: Expression;
}

export interface Closure extends SyntaxObject {
  exprKind: "closure";
  parameter?: string;
  body: Expression;
}

export interface Tuple extends SyntaxObject {
  exprKind: "tuple";
  values: Expression[];
}

export interface Procedure extends SyntaxObject {
  exprKind: "procedure";
  body: Statement[];
}

export interface If extends SyntaxObject {
  exprKind: "if";
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
  exprKind: "binop";
  op: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface Void extends SyntaxObject {
  exprKind: "void";
}

// Expression tools

/**
 * An exhaustive definition of functions used to destructure an expression.
 */
export interface ExpressionPattern<T> {
  Accessor: Fn<Accessor, T>;
  Number: Fn<Number, T>;
  String: Fn<String, T>;
  Name: Fn<Name, T>;
  Call: Fn<Call, T>;
  Closure: Fn<Closure, T>;
  Tuple: Fn<Tuple, T>;
  Procedure: Fn<Procedure, T>;
  Void: Fn<Void, T>;
  If: Fn<If, T>;
  BinaryOp: Fn<BinaryOp, T>;
}

export interface ExhaustiveExpressionPattern<T> extends ExpressionPattern<T> {
  Default?: never;
}

export interface PartialExpressionPattern<T> extends Partial<ExpressionPattern<T>> {
  Default: (e: Expression) => T;
}

export type ExpressionMatcher<T> = ExhaustiveExpressionPattern<T> | PartialExpressionPattern<T>;

/**
 * A function for destructuring an expression.
 *
 * @param p An ExpressionPattern definition
 */
export function matchExpression<T>(p: ExpressionMatcher<T>): (e: Expression) => T {
  return (e: Expression): T => {
    switch (e.exprKind) {
      case "number":
        return p.Number ? p.Number(e) : p.Default(e);
      case "string":
        return p.String ? p.String(e) : p.Default(e);
      case "name":
        return p.Name ? p.Name(e) : p.Default(e);
      case "accessor":
        return p.Accessor ? p.Accessor(e) : p.Default(e);
      case "call":
        return p.Call ? p.Call(e) : p.Default(e);
      case "closure":
        return p.Closure ? p.Closure(e) : p.Default(e);
      case "tuple":
        return p.Tuple ? p.Tuple(e) : p.Default(e);
      case "procedure":
        return p.Procedure ? p.Procedure(e) : p.Default(e);
      case "void":
        return p.Void ? p.Void(e) : p.Default(e);
      case "if":
        return p.If ? p.If(e) : p.Default(e);
      case "binop":
        return p.BinaryOp ? p.BinaryOp(e) : p.Default(e);
      default: {
        const __exhaust: never = e;
        return __exhaust;
      }
    }
  };
}
