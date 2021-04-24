// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { CallTracker } from "assert";
import { factory } from "omnimatch";
import { PeekableAsyncIterableIterator } from "./peekable";
import { CharacterCode, isNumeric, UnicodeScalarValue, WHITESPACE_CHARACTERS } from "./unicode";
import { debug, ReaderError } from "./utils";

// #region Reader Primitives

/**
 * A top-level lexical module is simply an inline list.
 */
export type LexicalModule = LexicalList<"inline">;

export type LexicalExpression = Readonly<Compound | Atom>;

type Compound = LexicalList | LexicalMap | LexicalSet;

/* interface LexicalTuple {
  kind: "tuple";
  values: Iterable<LexicalExpression>;
}*/

/**
 * The disposition of a list, referring to the context in which it was read:
 *
 * - "procedure": read from a #[] proc-array
 * - "array": read from an [] array-vec
 * - "list": read from a parenthesized () list
 * - "inline": any other context
 */
export type ListDisposition = "procedure" | "array" | "list" | "inline";

/**
 * The type of a lexical list, referring to expressions enclosed in an array/list-like
 * context, such as an array, list, procedure, tuple, module, or extended list context.
 *
 * [] () #[]
 */
export interface LexicalList<Disposition extends ListDisposition = ListDisposition> {
  kind: "list";
  /**
   * Array disposition, represents the context of the data
   *
   * - "array": square-bracket data array
   * - "list": paren tuple list
   * - "module": parsed from the top-level of a file
   */
  disposition: Disposition;
  contents: Iterable<LexicalExpression>;
}

/**
 * Valid types of expressions in the key position of a map.
 */
export type LexicalMapKey = LexicalList<"inline"> | SymbolAtom;

/**
 * A mapping from Key expressions to values.
 *
 * {}
 */
export interface LexicalMap {
  kind: "map";
  contents: Iterable<[LexicalMapKey, LexicalExpression]>;
}

/**
 * A lexical object denoting a set.
 *
 * #{}
 */
export interface LexicalSet {
  kind: "set";
  contents: Iterable<LexicalExpression>;
}

/**
 * Simple/primitive types that are leaves in the lexical expression
 * tree.
 */
export type Atom = SymbolAtom | StringAtom | NumberAtom;

/**
 * A symbol, or a basic contiguous word suitible for use as an identifier.
 */
export interface SymbolAtom {
  kind: "symbol";
  symbolName: string;
}

/**
 * A string, or an arbitrary buffer of UTF-8 encoded bytes.
 */
export interface StringAtom {
  kind: "string";
  contents: string;
}

/**
 * A numeric value.
 *
 * TODO: specify the reader's semantics about numbers. They're important.
 */
export interface NumberAtom {
  kind: "number";
  value: number;
}

export const make = factory<LexicalExpression>();

// #endregion

// #region Reader Sigils

const DELIMITER_PAIRS: Partial<Record<CharacterCode, CharacterCode>> = {
  // Open -> Closed
  [CharacterCode.OpenParen]: CharacterCode.CloseParen,
  [CharacterCode.FullwidthOpenParen]: CharacterCode.FullwidthCloseParen,
  [CharacterCode.OpenSquareBracket]: CharacterCode.CloseSquareBracket,
  [CharacterCode.FullwidthOpenSquareBracket]: CharacterCode.FullwidthCloseSquareBracket,
  [CharacterCode.OpenCurlyBrace]: CharacterCode.CloseCurlyBrace,
  [CharacterCode.FullwidthOpenCurlyBrace]: CharacterCode.FullwidthCloseCurlyBrace,

  // Closed -> Open
  [CharacterCode.CloseParen]: CharacterCode.OpenParen,
  [CharacterCode.FullwidthCloseParen]: CharacterCode.FullwidthOpenParen,
  [CharacterCode.CloseSquareBracket]: CharacterCode.OpenSquareBracket,
  [CharacterCode.FullwidthCloseSquareBracket]: CharacterCode.FullwidthOpenSquareBracket,
  [CharacterCode.CloseCurlyBrace]: CharacterCode.OpenCurlyBrace,
  [CharacterCode.FullwidthCloseCurlyBrace]: CharacterCode.FullwidthOpenCurlyBrace
};

// Characters that close lists
export const CLOSING_DELIMITERS: Set<CharacterCode> = new Set([
  CharacterCode.CloseParen,
  CharacterCode.CloseSquareBracket,
  CharacterCode.CloseCurlyBrace,
  CharacterCode.FullwidthCloseParen,
  CharacterCode.FullwidthCloseSquareBracket,
  CharacterCode.FullwidthCloseCurlyBrace
]);

// Characters that must yield symbols on their own
export const MUST_SPLIT_SIGILS: Set<CharacterCode> = new Set([
  CharacterCode.Period,
  CharacterCode.Colon,
  CharacterCode.Semicolon,
  CharacterCode.Comma,
  CharacterCode.LessThan,
  CharacterCode.GreaterThan,
  ...CLOSING_DELIMITERS.values()
]);

const DELIMITER_DISPOSITION: Partial<Record<CharacterCode, ListDisposition>> = {
  [CharacterCode.OpenParen]: "list",
  [CharacterCode.FullwidthOpenParen]: "list",
  [CharacterCode.OpenSquareBracket]: "array",
  [CharacterCode.FullwidthOpenSquareBracket]: "array"
};

// #endregion

// #region Reader State Management

interface ReaderState {
  scanner: Scanner;
  position: Position;
}

interface Position {
  line: number;
  column: number;
}

/**
 * Processes a stream of Unicode code points, storing information about
 * the current row/column in a given data structure.
 *
 * @param stream async iterable of Unicode scalar values to process
 * @param lineInfo mutable object holding the line/column information
 */
function annotateLines(
  iterable: PeekableAsyncIterableIterator<UnicodeScalarValue>,
  lineInfo: Position
): PeekableAsyncIterableIterator<UnicodeScalarValue> {
  const iter = iterable[Symbol.asyncIterator]();

  let bufferedCR = false;

  const _self = {
    peek: async (n?: number) => iter.peek(n as number),
    next: async (): Promise<IteratorResult<UnicodeScalarValue>> => {
      const result = await iter.next();

      if (result.done) {
        return result;
      }

      if (!bufferedCR && result.value === CharacterCode.CarriageReturn) {
        bufferedCR = true;
        return _self.next();
      }

      bufferedCR = result.value === CharacterCode.CarriageReturn;

      if (result.value === CharacterCode.LineFeed) {
        lineInfo.line += 1;
        lineInfo.column = 1;
      } else {
        lineInfo.column += 1;
      }

      return result;
    },
    [Symbol.asyncIterator]: () => {
      return _self;
    }
  };

  return _self as PeekableAsyncIterableIterator<UnicodeScalarValue>;
}

// #endregion

interface ScannerOptions {
  getMoreValues?: () => Promise<UnicodeScalarValue[]>
}

interface Scanner {
  readonly done: boolean; 
  take(): Promise<UnicodeScalarValue>;
  peek(): Promise<UnicodeScalarValue>;
}

function makeScanner(initialValues: UnicodeScalarValue[], options: ScannerOptions): Scanner {
  let idx = 0;
  let buffer = initialValues;

  let bufferedCR = true;
  let line = 0;
  let column = 0;

  function guard<T>(verb: () => T): () => Promise<T> {
    return async () => {
    if (scanner.done) {
      const nextValues = await options.getMoreValues?.();
      if (nextValues === undefined) {
        // TODO: big error
        throw new ReaderError("Unexpected end of file.")
      } else {
        buffer = buffer.concat(nextValues);
      }
    }

    return verb();
  }
  }

  const scanner = {
    get done() {
      return idx >= buffer.length;
    },
    take: guard(() => {
      const value = buffer[idx];

      switch (value) {
        case CharacterCode.CarriageReturn:

      }

      return buffer[idx++]
    }),
    peek: guard(() => buffer[idx])
  };

  return scanner;
}

// #region Reader Implementation

export function read(
  stream: UnicodeScalarValue[],
  incompleteStreamHandler?: () => Promise<UnicodeScalarValue[]>
): Promise<LexicalModule> {
  const position = { line: 1, column: 1 };

  const state: ReaderState = {
    scanner: makeScanner(stream, { getMoreValues: incompleteStreamHandler }),
    position
  };

  return readArray(state, CharacterCode.EOF, "inline");
}

async function readArray<Disposition extends ListDisposition>(
  state: ReaderState,
  until: CharacterCode | Set<CharacterCode>,
  disposition: Disposition
): Promise<LexicalList<Disposition>> {
  const { iter } = state;

  const result: LexicalExpression[] = [];

  const isUntil =
    typeof until === "number"
      ? (c: CharacterCode) => c === until
      : (c: CharacterCode) => until.has(c);

  if (disposition !== "inline") {
    // Discard opening delimiter
    await iter.next();
  }

  // Prime for a symbol
  await readWhitespace(state);

  /* try {*/
  while (!isUntil(await iter.peek())) {
    const expr = await readExpression(state);
    if (expr !== undefined) {
      result.push(expr);
    }
    await readWhitespace(state);
  }
  /* } catch (err) {
    // This is an error we can handle, since we can just terminate the list early.
    // TODO: let's hold off on exposing this for [], (), and #[] arrays. #[print "Test";]
    if (disposition === "inline") {
      return make.list({
        disposition,
        contents: result
      }) as LexicalList<Disposition>;
    } else {
      console.log("We found an error");
      throw err;
    }
  }*/

  // Discard the end token
  await iter.next();

  return make.list({
    disposition,
    contents: result
  }) as LexicalList<Disposition>;
}

async function readSet(state: ReaderState): Promise<LexicalSet> {
  const { iter } = state;

  const result: LexicalExpression[] = [];

  // Consume the curly brace that started this Set expression
  const { value } = await iter.next();

  const until = DELIMITER_PAIRS[value as CharacterCode] as UnicodeScalarValue;

  // Prime for a symbol
  await readWhitespace(state);

  while ((await iter.peek()) !== until) {
    const expr = await readExpression(state);
    if (expr !== undefined) {
      result.push(expr);
    }
    await readWhitespace(state);
  }

  // Discard the end token
  await iter.next();

  return make.set({
    contents: result
  });
}

/**
 * Read and discard all whitespace starting from the current position.
 *
 * @param anonymous reader state
 */
async function readWhitespace({ iter }: ReaderState): Promise<void> {
  while (WHITESPACE_CHARACTERS.has(await iter.peek())) {
    await iter.next();
  }
}

async function readExpression(state: ReaderState): Promise<LexicalExpression | undefined> {
  const { iter } = state;

  const value = await iter.peek();

  if (CLOSING_DELIMITERS.has(value)) {
    // We hit a closing delimiter. Let the caller handle it.
    return undefined;
  }

  switch (value) {
    case CharacterCode.ForwardSlash:
      // Could be a comment or a symbol
      return readCommentOrSymbol(state);
    case CharacterCode.OpenParen:
    case CharacterCode.FullwidthOpenParen:
    case CharacterCode.OpenSquareBracket:
    case CharacterCode.FullwidthOpenSquareBracket:
      return readArray(
        state,
        DELIMITER_PAIRS[value] as CharacterCode,
        DELIMITER_DISPOSITION[value] as ListDisposition
      );
    case CharacterCode.OpenCurlyBrace:
    case CharacterCode.FullwidthOpenCurlyBrace:
      return readMap(state, DELIMITER_PAIRS[value] as CharacterCode);
    case CharacterCode.NumberSign:
      return readAlt(state);
    default:
      return readAtom(state);
  }
}

async function readAlt(state: ReaderState): Promise<LexicalExpression> {
  const iter = state.iter;

  // Consume number sign
  await iter.next();

  const next = await iter.peek();

  switch (next) {
    case CharacterCode.OpenCurlyBrace:
    case CharacterCode.FullwidthOpenCurlyBrace:
      return readSet(state);
    case CharacterCode.OpenSquareBracket:
    case CharacterCode.FullwidthOpenSquareBracket:
      console.log("Reading array!");
      return readArray(state, DELIMITER_PAIRS[next] as CharacterCode, "procedure");
    default:
      throw new ReaderError(
        "Expected an open square bracket or an open curly brace after a number sign."
      );
  }
}

async function readAtom(state: ReaderState): Promise<Atom> {
  const { iter } = state;

  const next = await iter.peek();
  if (next === CharacterCode.DoubleQuote || next === CharacterCode.SingleQuote) {
    return readString(state);
  } else if (isNumeric(next)) {
    return readNumber(state);
  } else {
    return readSymbol(state);
  }
}

async function readString(state: ReaderState): Promise<StringAtom> {
  const { iter } = state;
  const delimiter = (await iter.next()).value;

  const buf: UnicodeScalarValue[] = [];

  let value;

  while ((value = await iter.peek()) !== delimiter) {
    if (value === CharacterCode.Backslash) {
      buf.push(await readEscaped(state));
    } else if (value === CharacterCode.DollarSign) {
      throw new ReaderError(
        "Dollar sign must be escaped (not implemented: interpolated string literals)"
      );
    } else if (value === -1) {
      throw new ReaderError("Unexpected end of file while reading string literal.");
    } else {
      buf.push(value);
      await iter.next();
    }
  }

  return make.string({
    contents: String.fromCodePoint(...buf)
  });
}

const ESCAPE_CODES: Partial<
  Record<CharacterCode, CharacterCode | ((state: ReaderState) => Promise<CharacterCode>)>
> = {
  [CharacterCode.DoubleQuote]: CharacterCode.DoubleQuote,
  [CharacterCode.SingleQuote]: CharacterCode.SingleQuote,
  [CharacterCode.LowercaseLetterN]: CharacterCode.LineFeed
};

async function readEscaped(state: ReaderState): Promise<UnicodeScalarValue> {
  const { iter } = state;
  await iter.next();
  const escapedUsv = (await iter.next()).value as UnicodeScalarValue;

  const characterOrHandler = ESCAPE_CODES[escapedUsv as CharacterCode];

  return typeof characterOrHandler === "number"
    ? characterOrHandler
    : typeof characterOrHandler === "function"
    ? characterOrHandler(state)
    : (() => {
        throw new ReaderError(`Unkonwn escape code ${String.fromCodePoint(escapedUsv)}`);
      })();
}

async function readNumber(state: ReaderState): Promise<NumberAtom> {
  const { iter } = state;

  const buffer = [];

  let value: UnicodeScalarValue;
  while (isNumeric((value = await iter.peek()))) {
    buffer.push(value);
    await iter.next();
  }

  return make.number({
    value: parseInt(String.fromCodePoint(...buffer))
  });
}

async function readMap(state: ReaderState, until: CharacterCode): Promise<LexicalMap> {
  const { iter } = state;

  const result: Array<[LexicalMapKey, LexicalExpression]> = [];

  await iter.next();

  await readWhitespace(state);

  while ((await iter.peek()) !== until) {
    const pair = await readKeyValuePair(state);

    if (pair !== undefined) {
      result.push(pair);
    }

    await readWhitespace(state);
  }

  // Discard the end token
  await iter.next();

  return make.map({
    contents: result
  });
}

async function readKeyValuePair(
  state: ReaderState,
  until: CharacterCode = CharacterCode.CloseCurlyBrace
): Promise<[LexicalMapKey, LexicalExpression]> {
  const { iter } = state;

  const key = await readArray(state, CharacterCode.Colon, "inline");
  await iter.next();
  await readWhitespace(state);
  const value = await readArray(state, new Set([CharacterCode.Comma, until]), "list");

  return [key, value];
}

async function readCommentOrSymbol(state: ReaderState): Promise<SymbolAtom | undefined> {
  const { iter } = state;

  // Take the first forward slash
  await iter.next();

  const next = await iter.peek();

  switch (next) {
    case CharacterCode.ForwardSlash:
    case CharacterCode.Asterisk:
      // Actually a comment
      await iter.next();
      return readComment(state, /* multiline */ next === CharacterCode.Asterisk) as Promise<
        undefined
      >;
    default:
      // Avoids lexical declaration in case
      return (async () => {
        const partialSymbol = await readSymbol(state, true);
        return make.symbol({
          symbolName: "/" + partialSymbol.symbolName
        });
      })();
  }
}

async function readComment({ iter }: ReaderState, multiline: boolean): Promise<void> {
  if (multiline) {
    await iter.next();
    let bufferedAsterisk = false;
    let value = await iter.peek();
    while (!bufferedAsterisk || value !== CharacterCode.ForwardSlash) {
      bufferedAsterisk = value === CharacterCode.Asterisk;

      value = await iter.peek();
    }
    await iter.next();
  } else {
    // Single line, read until newline
    while ((await iter.peek()) !== CharacterCode.LineFeed) {
      await iter.next();
    }
    await iter.next();
  }
}

async function readSymbol({ iter }: ReaderState, earlyBreak = false): Promise<SymbolAtom> {
  let value = await iter.peek();

  const accum: UnicodeScalarValue[] = [];

  let mustSplit = false;
  while (!WHITESPACE_CHARACTERS.has(value) && !(mustSplit = MUST_SPLIT_SIGILS.has(value))) {
    const next = await iter.next();
    accum.push(value);
    if (next.done) {
      break;
    } else {
      value = await iter.peek();
    }
  }

  if (accum.length === 0) {
    // Encountered nothing of value, check earlyBreak and yield a sigil if we found one
    if (earlyBreak) {
      // An empty symbol is allowed, so return one and don't pop the next code point
      return make.symbol({
        symbolName: ""
      });
    } else if (mustSplit) {
      // We can just yield this sigil as a symbol
      await iter.next();
      accum.push(value);
    } else {
      // This is an Internal Error, since we can only get here if there was whitespace
      // when it wasn't allowed
      return debug.fail("Failed to strip whitespace before calling readSymbol");
    }
  }

  return make.symbol({
    symbolName: String.fromCodePoint(...accum)
  });
}

// #endregion
