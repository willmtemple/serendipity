// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { SyntaxObject } from "../";
import { Expression } from "./expression";
import { Fn } from "../../../util/FuncTools";

export type Statement = Print | Let | If | ForIn | Forever | Do | Break | Hole;

export interface Print extends SyntaxObject {
  statementKind: "print";
  value: Expression;
}

export interface Let extends SyntaxObject {
  statementKind: "let";
  name: string;
  value: Expression;
}

export interface If extends SyntaxObject {
  statementKind: "if";
  condition: Expression;
  body: Statement;
  _else?: Statement;
}

export interface ForIn extends SyntaxObject {
  statementKind: "forin";
  binding: string;
  value: Expression;
  body: Statement;
}

export interface Forever extends SyntaxObject {
  statementKind: "forever";
  body: Statement;
}

export interface Do extends SyntaxObject {
  statementKind: "do";
  body: Expression;
}

export interface Break extends SyntaxObject {
  statementKind: "break";
}

export interface Hole extends SyntaxObject {
  statementKind: "@hole";
}

// Statement tools

export interface StatementPattern<T> {
  Print: Fn<Print, T>;
  Let: Fn<Let, T>;
  If: Fn<If, T>;
  ForIn: Fn<ForIn, T>;
  Forever: Fn<Forever, T>;
  Do: Fn<Do, T>;
  Break: Fn<Break, T>;
  Hole: Fn<Hole, T>;
}

export interface ExhaustiveStatementPattern<T> extends StatementPattern<T> {
  Default?: undefined;
}

export interface PartialStatementPattern<T> extends Partial<StatementPattern<T>> {
  Default: (s?: Statement) => T;
}

export type StatementMatcher<T> = ExhaustiveStatementPattern<T> | PartialStatementPattern<T>;

/**
 * A Fn for destructuring a Statement
 *
 * @param p The StatementPattern instance to use
 */
export function matchStatement<T>(p: StatementMatcher<T>): Fn<Statement, T> {
  return (s: Statement): T => {
    switch (s.statementKind) {
      case "print":
        return p.Print ? p.Print(s) : p.Default(s);
      case "let":
        return p.Let ? p.Let(s) : p.Default(s);
      case "if":
        return p.If ? p.If(s) : p.If(s);
      case "forin":
        return p.ForIn ? p.ForIn(s) : p.Default(s);
      case "forever":
        return p.Forever ? p.Forever(s) : p.Default(s);
      case "do":
        return p.Do ? p.Do(s) : p.Default(s);
      case "break":
        return p.Break ? p.Break(s) : p.Default(s);
      case "@hole":
        return p.Hole ? p.Hole(s) : p.Default(s);
      default: {
        const __exhaust: never = s;
        return __exhaust;
      }
    }
  };
}
