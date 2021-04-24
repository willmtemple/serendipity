// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { factory } from "omnimatch";

export type Result<T, E = unknown> = Ok<T> | Err<E>;

export interface Ok<T> {
  kind: "ok";
  value: T;
}

export interface Err<T> {
  kind: "err";
  err: T;
}

const baseFactory = factory<Result<unknown, unknown>>();

class UnwrapError extends Error {
  public constructor(v: unknown) {
    if (typeof v === "string") {
      super(v);
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      super(`Unwrapped Err(${v})`);
    }
  }
}

export const Result = {
  ok<T>(value: T): Ok<T> {
    return baseFactory.ok({ value }) as Ok<T>;
  },
  err<E>(err: E): Err<E> {
    return baseFactory.err({ err }) as Err<E>;
  },
  unwrap<T>(result: Result<T, string>): T {
    if (result.kind === "ok") {
      return result.value;
    } else {
      throw new UnwrapError(result.err);
    }
  },
  unwrapOr<T>(result: Result<T, unknown>, or: T): T {
    return result.kind === "ok" ? result.value : or;
  }
};
