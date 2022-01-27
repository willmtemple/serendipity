// Copyright (c) Will Temple
// Licensed under the MIT license.

import { CharacterCode } from "./unicode";

/**
 * Normalizes the line endings in a stream of CharacterCodes to always use
 * LF rather than CRLF line endings.
 *
 * @param iter an input iterator that can yield windows-style line endings
 * @returns an iterator that will always yield LF instead of CRLF
 */
export async function* normalizeLineEndings(iter: AsyncIterable<number>) {
  let heldCR = false;

  for await (const it of iter) {
    if (it === CharacterCode.CarriageReturn) {
      if (heldCR) {
        yield CharacterCode.LineFeed;
      } else {
        heldCR = true;
      }
      continue;
    } else if (it === CharacterCode.LineFeed) {
      heldCR = false;
    } else if (heldCR) {
      yield CharacterCode.LineFeed;
    }

    yield it;
  }

  if (heldCR) {
    yield CharacterCode.LineFeed;
  }
}
