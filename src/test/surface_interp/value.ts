import { Binder, Scope } from "./scope";
import { Statement } from "../../lib/lang/syntax/surface/statement";

export type Value = NumberV | StringV | ClosV | TupleV | ProcV | BoolV | VoidV;

export interface NumberV {
    kind: "number",
    value: number,
}

export interface StringV {
    kind: "string",
    value: string,
}

export interface ClosV {
    kind: "closure",
    value: {
        body: Binder,
        parameters: string[],
    },
}

export interface TupleV {
    kind: "tuple",
    value: Binder[],
}

export interface ProcV {
    kind: "proc",
    body: Statement[],
    scope: Scope,
}

export interface BoolV {
    kind: "boolean",
    value: boolean
}

export interface VoidV {
    kind: "void"
}