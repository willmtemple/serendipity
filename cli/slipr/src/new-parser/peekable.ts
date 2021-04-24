// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

export interface PeekableAsyncIterableIterator<T, TReturn = unknown>
  extends AsyncIterable<T>,
    AsyncIterator<T, TReturn> {
  peek(): Promise<T>;
  peek(n: number): Promise<T[]>;
  done: boolean;
  [Symbol.asyncIterator](): PeekableAsyncIterableIterator<T, TReturn>;
}

// TODO: this function behaves way differently than the sync one.
export function peekable<T, TReturn = unknown>(
  iterable: AsyncIterable<T>
): PeekableAsyncIterableIterator<T, TReturn> {
  const queue: IteratorResult<T>[] = [];

  const it = iterable[Symbol.asyncIterator]();

  let final: IteratorReturnResult<unknown> | undefined;

  const self = {
    peek: (async (n?: number): Promise<T | T[]> => {
      if (n !== undefined) {
        for (let i = queue.length; !final?.done && i < n; i++) {
          const v = await it.next();
          if (v.done) {
            final = v;
          }
          queue.push(v);
        }
        return queue.slice(0, Math.min(queue.length, n)).map((r) => r.value);
      } else if (queue.length === 0) {
        const v = await it.next();
        if (v.done) {
          final = v;
        }
        queue.push(v);
        return v.value;
      } else {
        return queue[0].value;
      }
    }) as PeekableAsyncIterableIterator<T>["peek"],
    next: () => {
      return queue.length > 0 ? Promise.resolve(queue.shift() as IteratorResult<T>) : it.next();
    },
    get done(): boolean {
      // Force a consideration of the
      self.peek(1);
      return queue.length === 0 && (final?.done ?? false);
    },
    [Symbol.asyncIterator]: () => self
  };

  return self;
}

export interface PeekableIterableIterator<T, TReturn = unknown, TNext = unknown>
  extends Iterable<T>,
    Iterator<T, TReturn> {
  peek(): T;
  peek(n: number): T[];
  take(): T;
  next(v?: TNext): IteratorResult<T, TReturn>;
  setErrorClass(err: ErrorConstructor): void;
  done: boolean;
  [Symbol.iterator](): PeekableIterableIterator<T, TReturn>;
}

export function peekableSync<T>(iterable: Iterable<T>): PeekableIterableIterator<T> {
  const queue: IteratorResult<T>[] = [];

  const it = iterable[Symbol.iterator]();

  let final: IteratorReturnResult<unknown> | undefined;

  let Err: ErrorConstructor = Error;

  // ???
  // eslint-disable-next-line no-shadow
  const self = {
    peek: ((n?: number): T | T[] => {
      if (n !== undefined) {
        for (let i = queue.length; !final?.done && i < n; i++) {
          const v = it.next();
          console.log("Peeked:", v)
          if (v.done) {
            final = v;
            break;
          }
          queue.push(v);
        }
        return queue.slice(0, Math.min(queue.length, n)).map((r) => r.value);
      } else if (queue.length === 0) {
        const v = it.next();
        if (v.done) {
          final = v;
          throw new Err("Reached end of stream.");
        }
        queue.push(v);
        return v.value;
      } else {
        return queue[0].value;
      }
    }) as PeekableIterableIterator<T>["peek"],
    take: () => {
      const v = self.peek(); // Will throw if something is wrong
      self.next();

      return v;
    },
    next: () => {
      const result = queue.length > 0 ? (queue.shift() as IteratorResult<T>) : it.next();
      if (result.done) {
        final = result;
      }
      return result;
    },
    get done(): boolean {
      // Force a consideration of the
      self.peek(1);
      return queue.length === 0 && (final?.done ?? false);
    },
    setErrorClass(e: ErrorConstructor) {
      Err = e;
    },
    [Symbol.iterator]: () => self
  };

  return self;
}
