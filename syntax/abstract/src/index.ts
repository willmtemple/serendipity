// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as _global from "./global";
import * as _expression from "./expression";
import * as _statement from "./statement";

// Pretty sure the lint errors on the following lines is a bug in typescript-eslint

export import global = _global;
export import statement = _statement;
export import expression = _expression;

/**
 * A module definition, containing the set of globals
 */
export interface Module {
  /** In our language, the global declarations are considered to be unordered. */
  globals: _global.Global[];
}
