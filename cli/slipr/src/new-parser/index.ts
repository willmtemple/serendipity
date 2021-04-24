// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Global, makeExpr, Module } from "@serendipity/syntax-surface";
import { factory, match } from "omnimatch";

import { peekable, PeekableIterableIterator, peekableSync } from "./peekable";
import { LexicalList, LexicalExpression, read, make as makeLexical, LexicalModule, ListDisposition } from "./reader";
import { scalars } from "./unicode";
import { asBuffer, cat, debug, map } from "./utils";

import surface from "@serendipity/syntax-surface";
import { Result } from "./result";

const makeGlobal = factory<Global>();

const enum Token {
  Semicolon = ";",
  Colon = ":",
  Arrow = "->",
  Comma = ","
}

const hole = () => ({ kind: "@hole" } as const);

class ParserError extends Error {}

// For the sake of my wrists
type LexStream = PeekableIterableIterator<LexicalExpression>;

const DEFAULT_DELIMITERS_BY_DISPOSITION: Record<ListDisposition, Token | null> = {
  array: Token.Comma,
  list: Token.Comma,
  procedure: Token.Semicolon,
  inline: null
};

function splitListByDelimiters(list: LexicalList, forceDelimiter?: Token): Array<LexicalList<"inline">> {
  const result: Array<LexicalList<"inline">> = [];
  let accum: LexicalExpression[] = [];

  const delimiter = forceDelimiter ?? DEFAULT_DELIMITERS_BY_DISPOSITION[list.disposition];

  if (delimiter === null) {
    return debug.fail(`splitListByDelimiters could not determine the correct delimiter: ${forceDelimiter ?? list.disposition}, ${list.disposition}`);
  }

  for (const expr of list.contents) {
    if (expr.kind === "symbol" && expr.symbolName === delimiter) {
      result.push(makeLexical.list({
        contents: accum,
        disposition: "inline"
      }) as LexicalList<"inline">);
      accum = [];
    } else {
      accum.push(expr);
    }
  }

  return result;
}

function parseBindingDefinition(iter: LexStream): surface.DefineFunction | surface.Define {
  const first = iter.take();

  if (first.kind === "symbol") {
    // define f(x) = x
    // define f = x -> x
    return makeGlobal.Define({
      name: "x",
      value: makeExpr.Void
    });
  } else {
    // TODO: in some contexts, a pattern should be valid here that will allow for destructuring
    throw new ParserError("Generic pattern bindings are not yet supported.");
  }
}

function parseStatement(_iter: Iterable<LexicalExpression>): Result<surface.Statement> {
  console.log("Also got here")
  return Result.ok(hole());
}

function parseExpression(iter: PeekableIterableIterator<LexicalExpression>): Result<surface.Expression> {
  //const next = iter[Symbol.iterator]().next().value as LexicalExpression;
  const next: any = null;

  console.log("Got here", iter.done);

  return match(next, {
    symbol: ({symbolName}) => Result.ok(makeExpr.Name(symbolName)),
    number: ({ value }) => Result.ok(makeExpr.Number(value)),
    string: ({ contents }) => Result.ok(makeExpr.String(contents)),
    list: (list) => match(list, {
      array: () => Result.ok(makeExpr.List(...splitListByDelimiters(list).map((l) => parseExpression(peekableSync(l.contents))).map((v) => Result.unwrapOr(v, hole())))),
      inline: () => debug.fail("Not implemented"),
      procedure: () => Result.ok(makeExpr.Procedure(...splitListByDelimiters(list).map((l) => parseStatement(l.contents)).map((v) => Result.unwrapOr(v, hole())))),
      list: () => debug.fail("Not implemented")
    }, "disposition")
  }) ?? debug.fail("Fatal error parsing expression.")
}

function parseGlobal(iter: LexStream): Global {
  const first = iter.take();

  console.log(first);

  if (first.kind !== "symbol") {
    throw new ParserError("Expected all global declarations to begin with a symbol.");
  } else {
    switch (first.symbolName) {
      case "main":
        console.log("We have a main!")
        return makeGlobal.Main({
          body: Result.unwrapOr(parseExpression(iter), hole())
        });
      case "define":
        return parseBindingDefinition(iter);
      default:
        throw new ParserError(`'${first.symbolName}' is not recognized as a global declaration.`);
    }
  }
}

function parseGlobals(mod: LexicalModule): Global[] {
  const result: Global[] = [];

  const iter: LexStream = peekableSync(mod.contents);

  while (!iter.done) {
    const nextGlobal = parseGlobal(iter);
    if (nextGlobal === undefined) {
      // TODO: diagnostic, recovery
      continue;
    }
    result.push(nextGlobal);
  }

  return result;
}

export async function parse(contents: AsyncIterable<string | Buffer>): Promise<Module> {
  const peekableStream = peekable(scalars(cat(map(contents, asBuffer))));

  // Read the stream to construct a lexical module, then parse it.
  const mod = await read(peekableStream);

  for (const expr of mod.contents) {
    console.log(expr)
  }

  return {
    globals: parseGlobals(mod)
  };
}
