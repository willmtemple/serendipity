// Copyright (c) Will Temple
// Licensed under the MIT license.

import { normalizeLineEndings } from "./crlf";
import { CharacterCode, scalars } from "./unicode";
import { asBuffer, cat, map } from "./utils";

export type IntoStream = AsyncIterable<string | Buffer>;

export interface Range {
  codePointOffset: number;
  codePointLength: number;
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

export interface CodePointIterator extends AsyncIterator<number> {
  readonly cursor: Cursor;
  readonly done: Promise<boolean>;
  peek(): Promise<IteratorResult<number>>;
  debug(): Promise<void>;
  stow(c: number): void;
  range: {
    open(): void;
    close(): Range;
  };
}

interface Cursor {
  offset: number;
  line: number;
  column: number;
}

export function makeCodePointIterator(data: IntoStream): CodePointIterator {
  const stream = cat(map(data, asBuffer));

  const codePoints = normalizeLineEndings(scalars(stream));

  const iter = codePoints[Symbol.asyncIterator]();

  const _restoreCol = [0];
  const _cursor: Cursor = {
    offset: 0,
    line: 0,
    column: 0,
  };

  const buffer: IteratorYieldResult<number>[] = [];

  async function take(): Promise<IteratorResult<number>> {
    const r = buffer.length > 0 ? buffer.shift()! : await iter.next();

    if (!r.done) {
      _cursor.offset += 1;
      if (r.value === CharacterCode.LineFeed) {
        _cursor.line += 1;
        _restoreCol.push(_cursor.column);
        _cursor.column = 0;
      } else {
        _cursor.column += 1;
      }
    }

    return r;
  }

  const rangeStack: Cursor[] = [];

  const self: CodePointIterator = {
    get cursor() {
      return { ..._cursor };
    },
    range: {
      open: () => {
        rangeStack.push(self.cursor);
      },
      close: (): Range => {
        const start = rangeStack.pop()!;
        const end = self.cursor;
        return {
          codePointOffset: start.offset,
          codePointLength: end.offset - start.offset,
          start,
          end,
        };
      },
    },
    async debug() {
      console.log(buffer);
      console.log(await self.peek());
    },
    get done() {
      return self.peek().then((v) => v.done ?? true);
    },
    peek: async () => {
      if (buffer.length > 0) {
        return buffer[0]!;
      }
      const v = await iter.next();
      if (!v.done) {
        buffer.push(v);
      }

      return v;
    },
    stow: (c: number) => {
      _cursor.offset -= 1;

      if (_cursor.column === 0) {
        _cursor.line -= 1;
        _cursor.column = _restoreCol.pop()!;
      } else {
        _cursor.column -= 1;
      }

      buffer.unshift({
        done: false,
        value: c,
      });
    },
    next: take,
  };

  return self;
}
