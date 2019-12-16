// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import * as _expression from "./expression";

export import expression = _expression;

/**
 * A module definition, containing the set of global definitions.
 */
export interface Module {
  definitions: Array<{
    name: string;
    value: expression.Expression;
  }>;
}
