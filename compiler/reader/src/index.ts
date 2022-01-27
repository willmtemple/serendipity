// Copyright (c) Will Temple
// Licensed under the MIT License.

import { LexicalElement } from "./models";
import { makeReader } from "./reader";

async function* asyncify<T>(iter: Iterable<T>): AsyncIterable<T> {
  for (const it of iter) {
    yield it;
  }
}

/**
 * A tagged template literal helper for reading strings.
 *
 * Example:
 *
 * ```typescript
 * const elements = read`fn foo(x: number) -> x + 5`
 * ```
 *
 * @param fragments
 * @param interpolated
 * @returns
 */
export function read(
  fragments: TemplateStringsArray,
  ...interpolated: LexicalElement[]
): AsyncIterable<LexicalElement> {
  if (interpolated.length > 0) {
    throw new Error("not implemented");
  }

  const reader = makeReader();

  return reader(asyncify(fragments));
}

export { makeReader } from "./reader";

export * from "./models";

export { intern, SIGIL_CHARACTERS, Sigils } from "./sigil";
