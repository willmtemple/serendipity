// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Expression } from "./expression";

export * from "./expression";

/**
 * A module definition, containing the set of global definitions.
 */
export interface Module {
  definitions: Array<{
    name: string;
    value: Expression;
  }>;
}
