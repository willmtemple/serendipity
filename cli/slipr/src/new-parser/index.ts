// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { LexicalElement, LexicalKind, makeReader } from "@serendipity/reader";
import { Global, Expression, Statement, Module } from "@serendipity/syntax-surface";
import { factory } from "omnimatch";
import { PeekableArray, peekableArray } from "./peekable";

const makeGlobal = factory<Global>();
const makeExpression = factory<Expression>();
const makeStatement = factory<Statement>();

const hole = () => ({ kind: "@hole" } as const);

// For the sake of my wrists
type LexPeek = PeekableArray<LexicalElement>;

export function parseBindingDefinition(_iter: LexPeek): Global | undefined {
  return undefined;
}

export function parseStatement(elements: LexicalElement[]): Statement | undefined {
  const iter = peekableArray(elements);

  const first = iter.take();

  if (first.kind !== "symbol") {
    throw new Error("Expected all statements to begin with a symbol.");
  } else {
    switch (first.symbolName) {
      case "print":
        return makeStatement.Print({
          value: parseExpression(iter) ?? hole(),
        });
      default:
        throw new Error(`'${first.symbolName}' is not recognized as a statement.`);
    }
  }
}

export function parseExpression(iter: LexPeek): Expression | undefined {
  console.log("Entered parseExpression");
  const next = iter.take();
  console.log("Took expression:", next);
  if (next.kind === LexicalKind.Array) {
    if (next.alt && next.delimiter === "square") {
      return makeExpression.Procedure({
        body: next.values.map(parseStatement).filter((s) => s !== undefined) as Statement[],
      });
    }
  } else if (next.kind === LexicalKind.String) {
    return makeExpression.String({
      value: String.fromCharCode(...next.contents),
    });
  } else {
    return undefined;
  }
}

function parseGlobal(iter: LexPeek): Global | undefined {
  console.log("Entered parseGlobal");

  const first = iter.take();

  console.log("parseGlobal", first);

  if (first.kind !== "symbol") {
    throw new Error("Expected all global declarations to begin with a symbol.");
  } else {
    switch (first.symbolName) {
      case "main":
        console.log("We have a main!");
        return makeGlobal.Main({
          body: parseExpression(iter) ?? hole(),
        });
      case "define":
        return parseBindingDefinition(iter);
      default:
        throw new Error(`'${first.symbolName}' is not recognized as a global declaration.`);
    }
  }
}

function parseGlobals(module: LexicalElement[]): Global[] {
  const result: Global[] = [];

  const iter = peekableArray(module);

  while (!iter.isDone()) {
    console.log("Trying to parse from a", iter.peek()?.kind);
    const nextGlobal = parseGlobal(iter);
    console.log("I parsed a", nextGlobal?.kind);
    if (nextGlobal === undefined) {
      // TODO: diagnostic, recovery
      continue;
    }
    console.log("Pushing", nextGlobal);
    result.push(nextGlobal);
    console.log("The iter is:");
    console.log(iter.isDone());
  }

  console.log("The iterable has succeeded.");

  return result;
}

export async function parse(contents: AsyncIterable<string | Buffer>): Promise<Module> {
  const reader = makeReader()(contents);

  console.log("Inside the parse fn.");

  const module: LexicalElement[] = [];
  for await (const global of reader) {
    console.log("Thing");
    module.push(global);
  }

  console.log("I collected the elements.", module);

  return {
    globals: parseGlobals(module),
  };
}
