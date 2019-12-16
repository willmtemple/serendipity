// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Fn } from "@serendipity/syntax/dist/util/FuncTools";
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
  exprKind: "number";
  value: number;
}

export interface String extends SyntaxObject {
  exprKind: "string";
  value: string;
}

export interface Boolean extends SyntaxObject {
  exprKind: "boolean";
  value: boolean;
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

export interface Arithmetic extends SyntaxObject {
  exprKind: "arithmetic";
  op: "+" | "-" | "/" | "*" | "%";
  left: Expression;
  right: Expression;
}

export interface With extends SyntaxObject {
  exprKind: "with";
  binding: [string, Expression];
  expr: Expression;
}

export interface Call extends SyntaxObject {
  exprKind: "call";
  callee: Expression;
  parameters: Expression[];
}

export interface Closure extends SyntaxObject {
  exprKind: "closure";
  parameters: string[];
  body: Expression;
}

export interface List extends SyntaxObject {
  exprKind: "list";
  contents: Expression[];
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

export interface Compare extends SyntaxObject {
  exprKind: "compare";
  op: "<" | ">" | "<=" | ">=" | "==" | "!=";
  left: Expression;
  right: Expression;
}

export interface Void extends SyntaxObject {
  exprKind: "void";
}

export interface Hole extends SyntaxObject {
  exprKind: "@hole";
}

// Expression tools

/**
 * An exhaustive definition of functions used to destructure an expression.
 */
export interface ExpressionPattern<T> {
  Accessor: Fn<Accessor, T>;
  Arithmetic: Fn<Arithmetic, T>;
  Boolean: Fn<Boolean, T>;
  Number: Fn<Number, T>;
  String: Fn<String, T>;
  Name: Fn<Name, T>;
  With: Fn<With, T>;
  Call: Fn<Call, T>;
  Closure: Fn<Closure, T>;
  List: Fn<List, T>;
  Tuple: Fn<Tuple, T>;
  Procedure: Fn<Procedure, T>;
  Void: Fn<Void, T>;
  If: Fn<If, T>;
  Compare: Fn<Compare, T>;
  Hole: Fn<Hole, T>;
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
      case "boolean":
        return p.Boolean ? p.Boolean(e) : p.Default(e);
      case "name":
        return p.Name ? p.Name(e) : p.Default(e);
      case "accessor":
        return p.Accessor ? p.Accessor(e) : p.Default(e);
      case "arithmetic":
        return p.Arithmetic ? p.Arithmetic(e) : p.Default(e);
      case "with":
        return p.With ? p.With(e) : p.Default(e);
      case "call":
        return p.Call ? p.Call(e) : p.Default(e);
      case "closure":
        return p.Closure ? p.Closure(e) : p.Default(e);
      case "list":
        return p.List ? p.List(e) : p.Default(e);
      case "tuple":
        return p.Tuple ? p.Tuple(e) : p.Default(e);
      case "procedure":
        return p.Procedure ? p.Procedure(e) : p.Default(e);
      case "void":
        return p.Void ? p.Void(e) : p.Default(e);
      case "if":
        return p.If ? p.If(e) : p.Default(e);
      case "compare":
        return p.Compare ? p.Compare(e) : p.Default(e);
      case "@hole":
        return p.Hole ? p.Hole(e) : p.Default(e);
      default: {
        const __exhaust: never = e;
        return __exhaust;
      }
    }
  };
}
