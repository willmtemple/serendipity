/**
 * Contains module-level syntax nodes (main/state/package
 * declarations)
 */

import { SyntaxObject } from '..';
import { Function } from '../../../util/FuncTools';
import { Expression } from './expression';

export type Global = Main | Define;

export interface Main extends SyntaxObject {
    globalKind: "main",
    body: Expression
}

export interface Define extends SyntaxObject {
    globalKind: "define",
    name: string,
    value: Expression,
}

export interface State extends SyntaxObject {
    globalKind: "state",
    
}

// Global tools

export interface GlobalPattern<T> {
    Main: Function<Main, T>,
    Define: Function<Define, T>,
}

export interface ExhaustiveGlobalPattern<T> extends GlobalPattern<T> {
    Default?: undefined,
}

export interface PartialGlobalPattern<T> extends Partial<GlobalPattern<T>> {
    Default: (g: Global) => T,
}

export type GlobalMatcher<T> = ExhaustiveGlobalPattern<T> | PartialGlobalPattern<T>;

export function matchGlobal<T>(p: GlobalMatcher<T>): Function<Global, T> {
    return (g: Global): T => {
        switch (g.globalKind) {
            case "main":
                return p.Main ? p.Main(g as Main) : p.Default(g);
            case "define":
                return p.Define ? p.Define(g as Define) : p.Default(g);
            default:
                const __exhaust : never = g;
                return __exhaust;
        }
    }
}
