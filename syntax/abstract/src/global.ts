// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Fn } from "@serendipity/syntax/dist/util/FuncTools";
import { SyntaxObject } from "@serendipity/syntax";
import { Expression } from "./expression";

export type Global = Main | Define;

export interface Main extends SyntaxObject {
  globalKind: "main";
  body: Expression;
}

export interface Define extends SyntaxObject {
  globalKind: "define";
  name: string;
  value: Expression;
}

export interface State extends SyntaxObject {
  globalKind: "state";
}

// Global tools

export interface GlobalPattern<T> {
  Main: Fn<Main, T>;
  Define: Fn<Define, T>;
}

export interface ExhaustiveGlobalPattern<T> extends GlobalPattern<T> {
  Default?: undefined;
}

export interface PartialGlobalPattern<T> extends Partial<GlobalPattern<T>> {
  Default: (g: Global) => T;
}

export type GlobalMatcher<T> = ExhaustiveGlobalPattern<T> | PartialGlobalPattern<T>;

export function matchGlobal<T>(p: GlobalMatcher<T>): Fn<Global, T> {
  return (g: Global): T => {
    switch (g.globalKind) {
      case "main":
        return p.Main ? p.Main(g) : p.Default(g);
      case "define":
        return p.Define ? p.Define(g) : p.Default(g);
      default: {
        const __exhaust: never = g;
        return __exhaust;
      }
    }
  };
}
