import { Function } from "./FuncTools";

/**
 * Rust-style Results for TypeScript
 */

export type Result<T, E> = Ok<T> | Error<E>;

export interface Ok<T> {
    kind: "ok",
    value: T,
}

export function ok<T>(value: T) : Ok<T> {
    return {
        kind: "ok",
        value
    }
}

export interface Error<E> {
    kind: "error",
    error: E,
}

export function error<E>(error: E) : Error<E> {
    return {
        kind: "error",
        error
    }
}

export interface ResultMatcher<T, OkT, ErrT> {
    Ok: Function<Ok<OkT>, T>,
    Error: Function<Error<ErrT>, T>
}

export function matchResult<T, OkT, ErrT>(m: ResultMatcher<T, OkT, ErrT>) : Function<Result<OkT, ErrT>, T> {
    return (r: Result<OkT, ErrT>) : T => {
        switch (r.kind) {
            case "ok":
                return m.Ok(r as Ok<OkT>);
            case "error":
                return m.Error(r as Error<ErrT>);
            default:
                const __exhaust : never = r;
                return __exhaust;
        }
    }
}

export function unwrap<T, E>(r: Result<T, E>) : T {
    if (r.kind === "ok") { 
        return r.value;
    } else if (r.kind === "error") {
        throw new Error(r.error.toString());
    } else {
        const __exhaust : never = r;
        return __exhaust;
    }
}

export function unwrap_or<T>(r: Result<T, any>, def: T) : T {
    return (r.kind === "ok") ? r.value : def;
}