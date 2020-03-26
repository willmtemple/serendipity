// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Fn } from "./FuncTools";

/**
 * Rust-style Results for TypeScript
 */

export type Result<T, E> = Ok<T> | ResultError<E>;

export interface Ok<T> {
  kind: "ok";
  value: T;
}

export function ok<T>(value: T): Ok<T> {
  return {
    kind: "ok",
    value
  };
}

export interface ResultError<E> {
  kind: "error";
  error: E;
}

export function error<E>(err: E): ResultError<E> {
  return {
    kind: "error",
    error: err
  };
}

export interface ResultMatcher<T, OkT, ErrT> {
  Ok: Fn<Ok<OkT>, T>;
  Error: Fn<ResultError<ErrT>, T>;
}

export function matchResult<T, OkT, ErrT>(
  m: ResultMatcher<T, OkT, ErrT>
): Fn<Result<OkT, ErrT>, T> {
  return (r: Result<OkT, ErrT>): T => {
    switch (r.kind) {
      case "ok":
        return m.Ok(r);
      case "error":
        return m.Error(r);
      default:
        // eslint-disable-next-line no-case-declarations
        const __exhaust: never = r;
        return __exhaust;
    }
  };
}

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.kind === "ok") {
    return r.value;
  } else if (r.kind === "error") {
    throw new Error("" + r.error);
  } else {
    const __exhaust: never = r;
    return __exhaust;
  }
}

export function unwrapOr<T, E>(r: Result<T, E>, def: T): T {
  return r.kind === "ok" ? r.value : def;
}
