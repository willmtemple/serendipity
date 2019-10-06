/**
 * Statement definitions for syntax.
 */

import { SyntaxObject } from "..";
import { Expression } from "./expression";
import { Function } from "../../../util/FuncTools";

export type Statement = Print | Let | If | ForIn | Forever | Do | Break;

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

// Statement tools

export interface StatementPattern<T> {
  Print: Function<Print, T>;
  Let: Function<Let, T>;
  If: Function<If, T>;
  ForIn: Function<ForIn, T>;
  Forever: Function<Forever, T>;
  Do: Function<Do, T>;
  Break: Function<Break, T>;
}

export interface ExhaustiveStatementPattern<T> extends StatementPattern<T> {
  Default?: undefined;
}

export interface PartialStatementPattern<T> extends Partial<StatementPattern<T>> {
  Default: (s?: Statement) => T;
}

export type StatementMatcher<T> = ExhaustiveStatementPattern<T> | PartialStatementPattern<T>;

/**
 * A function for destructuring a Statement
 *
 * @param p The StatementPattern instance to use
 */
export function matchStatement<T>(p: StatementMatcher<T>): Function<Statement, T> {
  return (s: Statement): T => {
    switch (s.statementKind) {
      case "print":
        return p.Print ? p.Print(s as Print) : p.Default(s);
      case "let":
        return p.Let ? p.Let(s as Let) : p.Default(s);
      case "if":
        return p.If ? p.If(s as If) : p.If(s);
      case "forin":
        return p.ForIn ? p.ForIn(s as ForIn) : p.Default(s);
      case "forever":
        return p.Forever ? p.Forever(s as Forever) : p.Default(s);
      case "do":
        return p.Do ? p.Do(s as Do) : p.Default(s);
      case "break":
        return p.Break ? p.Break(s as Break) : p.Default(s);
      default:
        const __exhaust: never = s;
        return __exhaust;
    }
  };
}
