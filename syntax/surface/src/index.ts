// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { factory } from "omnimatch";

import * as _global from "./global";
import * as _expression from "./expression";
import * as _statement from "./statement";

type Expression = _expression.Expression;
type Statement = _statement.Statement;

export * from "./global";
export {
  If,
  Call,
  List,
  Name,
  Void,
  With,
  Tuple,
  Number,
  String,
  Boolean,
  Closure,
  Compare,
  Accessor,
  Procedure,
  Arithmetic,
  Record,
  Expression,
  Hole as ExpressionHole,
} from "./expression";
export {
  Do,
  If as IfStatement,
  Let,
  Set,
  Break,
  ForIn,
  Print,
  Forever,
  Statement,
  Hole as StatementHole,
} from "./statement";

const expr = factory<_expression.Expression>();

export const makeExpr = {
  If: (cond: Expression, then: Expression, _else: Expression) => expr.If({ cond, then, _else }),
  Call: (callee: Expression, ...parameters: Expression[]) => expr.Call({ callee, parameters }),
  List: (...values: Expression[]) => expr.List({ contents: values }),
  Name: (name: string) => expr.Name({ name }),
  Void: { kind: "Void" } as _expression.Void,
  With: (binding: [string, Expression], body: Expression) => expr.With({ binding, expr: body }),
  Tuple: (...values: Expression[]) => expr.Tuple({ values }),
  Number: (n: number) => expr.Number({ value: n }),
  String: (s: string) => expr.String({ value: s }),
  Boolean: (b: boolean) => expr.Boolean({ value: b }),
  Closure: (parameters: string[], body: Expression) => expr.Closure({ parameters, body }),
  Compare: (op: _expression.Compare["op"], left: Expression, right: Expression) =>
    expr.Compare({ op, left, right }),
  Accessor: (accessee: Expression, index: Expression) => expr.Accessor({ accessee, index }),
  Procedure: (...body: Statement[]) => expr.Procedure({ body }),
  Arithmetic: (op: _expression.Arithmetic["op"], left: Expression, right: Expression) =>
    expr.Arithmetic({ op, left, right }),
};

/**
 * A module definition, containing the set of globals
 */
export interface Module {
  /** In our language, the global declarations are considered to be unordered. */
  globals: _global.Global[];
}
