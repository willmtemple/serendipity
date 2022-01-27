// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/* eslint-disable no-console */

export const debug = {
  assert(test: boolean | string | number | (() => boolean), ...values: unknown[]): void {
    if ((typeof test !== "function" && !test) || (typeof test === "function" && !test())) {
      console.trace("PANIC: Assertion failed:", ...values);
      console.error(
        "You have found an internal compiler error. This is not a problem with your code."
      );
      throw new ReaderError(`Internal error: Failed: ${values.join(",")}`);
    }
  },
  fail(...values: unknown[]): never {
    console.trace("PANIC: Fail:", ...values);
    console.error(
      "You have found an internal compiler error. This is not a problem with your code."
    );
    throw new ReaderError(`Internal error: ${values.join(",")}`);
  },
  unreachable(...values: unknown[]): never {
    console.trace("PANIC: Unreachable:", ...values);
    console.error(
      "You have found an internal compiler error. This is not a problem with your code."
    );
    throw new ReaderError(`Internal error: Reached unreachable:${values.join(",")}`);
  },
  exhaust(...values: never[]): void {
    console.trace("PANIC: Exhaust:", ...values);
    console.error(
      "You have found an internal compiler error. This is not a problem with your code."
    );
    throw new ReaderError(
      `Internal error: Reached unreachable exhaustive check:${values.join(",")}`
    );
  },
};

export class ReaderError extends Error {}

// #region Generator Helpers

export async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const accum = [];

  for await (const v of iter) {
    accum.push(v);
  }

  return accum;
}

export function asBuffer(input: string | Buffer): Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  } else {
    return Buffer.from(input, "utf-8");
  }
}

export async function* cat<T>(...iters: AsyncIterable<Iterable<T>>[]): AsyncIterable<T> {
  for (const iter of iters) {
    for await (const it of iter) {
      yield* it;
    }
  }
}

export async function* map<T, V>(iter: AsyncIterable<T>, f: (i: T) => V): AsyncIterable<V> {
  for await (const v of iter) {
    yield f(v);
  }
}

// #endregion
