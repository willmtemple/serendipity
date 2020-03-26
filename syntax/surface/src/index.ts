// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as _global from "./global";
import * as _expression from "./expression";
import * as _statement from "./statement";

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
  Expression,
  Hole as ExpressionHole
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
  Hole as StatementHole
} from "./statement";

/**
 * A module definition, containing the set of globals
 */
export interface Module {
  /** In our language, the global declarations are considered to be unordered. */
  globals: _global.Global[];
}
