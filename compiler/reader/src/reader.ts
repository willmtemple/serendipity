// Copyright (c) William Temple
// Licensed under the MIT license.

import BigNumber from "bignumber.js";

import { CodePointIterator, IntoStream, makeCodePointIterator } from "./codePointIterator";
import {
  LexicalArray,
  LexicalAtom,
  LexicalElement,
  LexicalElementCommon,
  LexicalKind,
  LexicalList,
  NumberAtom,
  SigilAtom,
  StringAtom,
  SymbolAtom,
} from "./models";
import { intern, Sigils, SIGIL_CHARACTERS } from "./sigil";
import {
  CharacterCode,
  isNumeric,
  numeral,
  NUMERALS,
  utf8Encode,
  WHITESPACE_CHARACTERS,
} from "./unicode";
import { collect } from "./utils";

export interface ReaderConfiguration {}

export type Reader = (data: IntoStream) => AsyncIterable<LexicalElement>;

interface ReaderContext {
  iter: CodePointIterator;
}

export function makeReader(_config?: Partial<ReaderConfiguration>): Reader {
  //const _options = { ...defaultReaderConfiguration, ...config };
  return async function* (data: IntoStream) {
    const iter = makeCodePointIterator(data);

    const ctx: ReaderContext = { iter };

    yield* readListBody(ctx);
  };
}

async function withPeek<T>(ctx: ReaderContext, h: (character: number) => Promise<T>): Promise<T> {
  const it = await ctx.iter.peek();

  return it.done ? Promise.reject("unexpected end of stream") : h(it.value);
}

async function isClosing(ctx: ReaderContext): Promise<boolean> {
  await scanWhitespace(ctx);
  const value = await ctx.iter.peek();

  return (
    !value.done &&
    (value.value === CharacterCode.CloseSquareBracket ||
      value.value === CharacterCode.CloseCurlyBrace ||
      value.value === CharacterCode.CloseParen)
  );
}

async function* readListBody(ctx: ReaderContext): AsyncGenerator<LexicalElement> {
  while (!(await ctx.iter.done)) {
    const hasLeadingWhitespace = await scanWhitespace(ctx);
    if (!(await ctx.iter.done)) {
      const element = await readElement(ctx);
      if (element !== undefined) {
        yield Object.assign(element, {
          metadata: {
            ...element.metadata,
            hasLeadingWhitespace,
          },
        } as LexicalElementCommon);
      } else if (await isClosing(ctx)) {
        break;
      }
    }
  }
}

async function* readSegmentedListBodies(
  ctx: ReaderContext,
  separator: symbol
): AsyncGenerator<LexicalElement[]> {
  let accum: LexicalElement[] = [];
  while (await canTake(ctx)) {
    const hasLeadingWhitespace = await scanWhitespace(ctx);
    if (await canTake(ctx)) {
      const element = await readElement(ctx);
      if (element?.kind === LexicalKind.Sigil && element.sigil === separator) {
        yield accum;
        accum = [];
      } else if (element !== undefined) {
        accum.push(
          Object.assign(element, {
            metadata: {
              ...element.metadata,
              hasLeadingWhitespace,
            },
          })
        );
      } else if (await isClosing(ctx)) {
        break;
      }
    }
  }

  if (accum.length > 0) {
    // TODO: should this actually just yield in all cases?
    yield accum;
  }
}

export function readElement(ctx: ReaderContext): Promise<LexicalElement | undefined> {
  return withPeek<LexicalElement | undefined>(ctx, (v) => {
    switch (v) {
      case CharacterCode.OpenParen:
        return readList(ctx);
      case CharacterCode.OpenCurlyBrace:
      case CharacterCode.OpenSquareBracket:
        return readArray(ctx, false);
      case CharacterCode.NumberSign:
        return readElementAlt(ctx);
      default:
        return readAtomOrComment(ctx);
    }
  });
}

async function readElementAlt(ctx: ReaderContext): Promise<LexicalElement | undefined> {
  await assertTake(ctx, CharacterCode.NumberSign);

  return withPeek<LexicalElement | undefined>(ctx, (v) => {
    switch (v) {
      case CharacterCode.OpenCurlyBrace:
      case CharacterCode.OpenSquareBracket:
        return readArray(ctx, true);
      default:
        // TODO: diagnostic for this -- it's an error to use alt mode
        return readElement(ctx);
    }
  });
}

async function assertTake(
  ctx: ReaderContext,
  predicate?: number | ((c: number) => boolean)
): Promise<number> {
  const v = await ctx.iter.next();

  const _p =
    predicate !== undefined
      ? typeof predicate === "function"
        ? predicate
        : (c: number) => c === predicate
      : undefined;

  if (v.done || (_p !== undefined && !_p(v.value))) {
    throw new Error("failed assertion: take");
  }

  return v.value;
}

async function canTake(ctx: ReaderContext, predicate?: (c: number) => boolean): Promise<boolean> {
  const v = await ctx.iter.peek();

  return !v.done && (predicate?.(v.value) ?? true);
}

async function readList(ctx: ReaderContext): Promise<LexicalList> {
  await assertTake(ctx, CharacterCode.OpenParen);

  const values = await collect(readListBody(ctx));

  await scanWhitespace(ctx);

  await assertTake(ctx, CharacterCode.CloseParen);

  return {
    kind: LexicalKind.List,
    values,
  };
}

export async function readArray(ctx: ReaderContext, alt: boolean = false): Promise<LexicalArray> {
  const open = await assertTake(
    ctx,
    (c) => c === CharacterCode.OpenSquareBracket || c === CharacterCode.OpenCurlyBrace
  );

  const values = await collect(readSegmentedListBodies(ctx, alt ? Sigils.Semicolon : Sigils.Comma));

  await scanWhitespace(ctx);

  await assertTake(
    ctx,
    open === CharacterCode.OpenSquareBracket
      ? CharacterCode.CloseSquareBracket
      : CharacterCode.CloseCurlyBrace
  );

  return {
    kind: LexicalKind.Array,
    alt,
    delimiter: open === CharacterCode.OpenSquareBracket ? "square" : "curly",
    values,
  };
}

export async function readAtomOrComment(ctx: ReaderContext): Promise<LexicalAtom | undefined> {
  return withPeek<LexicalAtom | undefined>(ctx, (v) => {
    switch (v) {
      case CharacterCode.ForwardSlash:
        return readCommentOrSigil(ctx);
      case CharacterCode.CloseCurlyBrace:
      case CharacterCode.CloseParen:
      case CharacterCode.CloseSquareBracket:
        return Promise.resolve(undefined);
      case CharacterCode.DoubleQuote:
      case CharacterCode.SingleQuote:
        return readString(ctx);
      default:
        return isNumeric(v) ? readNumber(ctx) : readSymbolOrSigil(ctx);
    }
  });
}

const BASE_SPECIFIERS: Map<number, number> = new Map([
  [0x62, 2], // LATIN SMALL LETTER B
  [0x6f, 8], // LATIN SMALL LETTER O
  [0x64, 10], // LATIN SMALL LETTER D
  [0x78, 16], // LATIN SMALL LETTER F
]);

export async function readNumber(ctx: ReaderContext): Promise<NumberAtom | undefined> {
  const { done, value: firstDigit } = await ctx.iter.peek();

  if (done) {
    return undefined;
  }

  let base = 10;

  if (firstDigit === numeral(0)) {
    await assertTake(ctx, numeral(0));
    // We could be looking at a base specifier
    if (await canTake(ctx, (c) => BASE_SPECIFIERS.has(c))) {
      base = BASE_SPECIFIERS.get(await assertTake(ctx))!;
    }

    // Clean up the remaining zeroes.
    if (await canTake(ctx, (c) => c === numeral(0))) {
      await accumAll(ctx, (c) => c === numeral(0));
    }
  }

  const accum = await accumAll(ctx, (c) => NUMERALS.has(c) || c === CharacterCode.Period);

  return {
    kind: LexicalKind.Number,
    value: new BigNumber(String.fromCodePoint(...accum), base),
  };
}

export async function readCommentOrSigil(ctx: ReaderContext): Promise<SigilAtom | undefined> {
  await assertTake(ctx, CharacterCode.ForwardSlash);

  const isComment = await canTake(
    ctx,
    (c) => c === CharacterCode.ForwardSlash || c === CharacterCode.Asterisk
  );
  ctx.iter.stow(CharacterCode.ForwardSlash);

  return isComment ? readComment(ctx) : readSigil(ctx);
}

export async function readComment(ctx: ReaderContext): Promise<undefined> {
  await assertTake(ctx, CharacterCode.ForwardSlash);

  const kind = await assertTake(
    ctx,
    (c) => c === CharacterCode.ForwardSlash || c === CharacterCode.Asterisk
  );

  if (kind === CharacterCode.ForwardSlash) {
    await accumAll(ctx, (c) => c !== CharacterCode.LineFeed);
  } else {
    await readMultiLineComment(ctx);
  }

  return undefined;
}

export async function readMultiLineComment(ctx: ReaderContext): Promise<undefined> {
  while (!(await ctx.iter.done)) {
    await accumAll(ctx, (c) => c !== CharacterCode.Asterisk);

    if (!(await ctx.iter.done)) {
      await assertTake(ctx, CharacterCode.Asterisk);

      const next = await ctx.iter.peek();
      if (!next.done && next.value === CharacterCode.ForwardSlash) {
        // Comment over
        await assertTake(ctx, CharacterCode.ForwardSlash);
        break;
      }
    }
  }

  return undefined;
}

export async function takeEscapeSequence(ctx: ReaderContext): Promise<number> {
  await assertTake(ctx, CharacterCode.Backslash);

  const v = await ctx.iter.peek();

  if (v.done) {
    // TODO: what should this actually do?
    return 0;
  }

  const control = String.fromCodePoint(v.value);

  switch (control) {
    case "n":
      return CharacterCode.LineFeed;
    case "r":
      return CharacterCode.CarriageReturn;
    case "t":
      return CharacterCode.Tab;
    case "0":
      return 0;
    default:
      return v.value;
  }
}

export async function readString(ctx: ReaderContext): Promise<StringAtom> {
  const delimiter = await assertTake(
    ctx,
    (c) => c === CharacterCode.DoubleQuote || c === CharacterCode.SingleQuote
  );

  const buffer: number[] = [];

  while (!((await ctx.iter.done) || ((await ctx.iter.peek()).value as number) === delimiter)) {
    const v = (await ctx.iter.next()).value as number;

    if (v === CharacterCode.LineFeed) {
      // TODO: raise a diagnostic
      break;
    }

    if (v === CharacterCode.Backslash) {
      buffer.push(...utf8Encode(await takeEscapeSequence(ctx)));
      continue;
    }

    buffer.push(...utf8Encode(v));
  }

  await assertTake(ctx, delimiter);

  return {
    kind: LexicalKind.String,
    contents: new Uint8Array(buffer),
  };
}

async function readSymbolOrSigil(ctx: ReaderContext): Promise<SymbolAtom | SigilAtom> {
  return withPeek(
    ctx,
    (value): Promise<SymbolAtom | SigilAtom> =>
      SIGIL_CHARACTERS.has(value) ? readSigil(ctx) : readSymbol(ctx)
  );
}

function isDelimiter(c: number): boolean {
  return (
    c === CharacterCode.OpenParen ||
    c === CharacterCode.OpenCurlyBrace ||
    c === CharacterCode.OpenSquareBracket ||
    c === CharacterCode.CloseParen ||
    c === CharacterCode.CloseCurlyBrace ||
    c === CharacterCode.CloseSquareBracket ||
    c === CharacterCode.SingleQuote ||
    c === CharacterCode.DoubleQuote
  );
}

async function accumAll(ctx: ReaderContext, predicate: (c: number) => boolean): Promise<number[]> {
  const buffer = [await assertTake(ctx, predicate)];

  while (await canTake(ctx, predicate)) {
    buffer.push((await ctx.iter.next()).value as number);
  }

  return buffer;
}

export async function readSymbol(ctx: ReaderContext): Promise<SymbolAtom> {
  const canConstituteSymbol = (c: number) =>
    !(isDelimiter(c) || WHITESPACE_CHARACTERS.has(c) || SIGIL_CHARACTERS.has(c));

  return {
    kind: LexicalKind.Symbol,
    symbolName: String.fromCodePoint(...(await accumAll(ctx, canConstituteSymbol))),
  };
}

export async function readSigil(ctx: ReaderContext): Promise<SigilAtom> {
  return {
    kind: LexicalKind.Sigil,
    sigil: intern(String.fromCodePoint(...(await accumAll(ctx, (c) => SIGIL_CHARACTERS.has(c))))),
  };
}

async function scanWhitespace(ctx: ReaderContext): Promise<boolean> {
  let wasWhitespaceEncountered = false;
  while (await canTake(ctx, (c) => WHITESPACE_CHARACTERS.has(c))) {
    await ctx.iter.next();
    wasWhitespaceEncountered = true;
  }

  return wasWhitespaceEncountered;
}
