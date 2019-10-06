// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

export interface SyntaxObject {
  /** Generic key-value store for object metadata. For use by, e.g. the text parser. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: { [k: string]: any };
}
