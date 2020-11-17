// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License version 3 or later.

import { Module } from "@serendipity/syntax-surface";

const debug = {
  assert(test: boolean | string | number | (() => boolean), ...values: any[]): void {
    if ((typeof test !== "function" && !test) || (typeof test === "function" && !test())) {
      console.trace("PANIC: Assertion failed:", ...values);
    }
  },
  fail(...values: any[]): never {
    console.trace("PANIC: Fail:", ...values);
    process.exit(1);
  },
  unreachable(...values: any[]): never {
    console.trace("PANIC: Unreachable:", ...values);
    process.exit(1);
  }
};

export interface ParseInformation {
  lineSpan: [number, number];
  colSpan: [number, number];
}

export type SExpression = ParseInformation & (ListSExpression | Atom);

type ListSExpression = Array<SExpression>;

type Atom = SymbolAtom | StringAtom | NumericAtom;

interface SymbolAtom {
  kind: "SymbolAtom";
  symbolName: string;
}

interface StringAtom {
  kind: "StringAtom";
  contents: Buffer;
}

interface NumericAtom {
  kind: "NumericAtom";
  value: number;
}

export type Token<Storage = Buffer> = (NonAtomicTokenInfo | AtomicTokenInfo) &
  CommonTokenInfo<Storage>;

export interface CommonTokenInfo<Storage> {
  readonly slice: Slice<Storage>;
}

export type NonAtomicTokenInfo =
  | StringTokenInfo
  | NumberTokenInfo
  | WhitespaceTokenInfo;

export const enum StringDelimiterKind {
  Double = 0x22,
  Single = 0x27,
  Grave = 0x60
}

/**
 * Information about a string token
 */
export interface StringTokenInfo {
  kind: TokenKind.String;
  contents: Buffer;
  delimiter: StringDelimiterKind;
  /**
   * Whether or not the sequence \( was encountered during scanning
   * 
   * @remarks not implemented, always false
   */
  hasInterpolationMarkers: boolean;
}

export const enum NumberBase {
  Binary = 2,
  Octal = 8,
  Decimal = 10,
  Hexadecimal = 16
}

/**
 * Information about a number token
 */
export interface NumberTokenInfo {
  kind: TokenKind.Number,
  contents: string;
  base: NumberBase;
}

/**
 * Information about a whitespace token
 */
export interface WhitespaceTokenInfo {
  kind: TokenKind.Whitespace;
  newLines: number;
}

/**
 * Information about tokens that don't have any associated
 * metadata information. This type represents simple non-terminals
 * such as "(", ")", and numbers.
 */
export interface AtomicTokenInfo {
  kind: Exclude<TokenKind, NonAtomicTokenInfo["kind"]>;
}

export const enum TokenKind {
  EOF = -1,
  OpenParenthesis,
  CloseParenthesis,
  OpenBracket,
  CloseBracket,
  OpenBrace,
  CloseBrace,
  OpenAngle,
  CloseAngle,
  Backtick,
  Whitespace,
  Ellipsis,
  Period,
  Minus,
  String,
  Number,
  Symbol,
  Comment
}

export const enum CharacterCode {
  OpenParen = 0x28, // LEFT PARENTHESIS
  FullwidthOpenParen = 0xff08, // FULLWIDTH LEFT PARENTHESIS

  CloseParen = 0x29, // RIGHT PARENTHESIS
  FullwidthCloseParen = 0xff09, // RIGHT PARENTHESIS

  OpenSquareBracket = 0x5b, // LEFT SQUARE BRACKET
  FullwidthOpenSquareBracket = 0xff3b, // FULLWIDTH LEFT SQUARE BRACKET

  CloseSquareBracket = 0x5d, // RIGHT SQUARE BRACKET
  FullwidthCloseSquareBracket = 0xff3d, // FULLWIDTH RIGHT SQUARE BRACKET

  OpenCurlyBrace = 0x7b, // LEFT CURLY BRACKET
  FullwidthOpenCurlyBrace = 0xff5b, // FULLWIDTH LEFT CURLY BRACKET

  CloseCurlyBrace = 0x7d, // RIGHT CURLY BRACKET
  FullwidthCloseCurlyBrace = 0xff5d, // FULLWIDTH RIGHT CURLY BRACKET

  LessThan = 0x3c, // LESS-THAN SIGN
  FullwidthLessThan = 0xff1c, // FULLWIDTH LESS-THAN SIGN
  OpenAngle = 0x3008, // LEFT ANGLE BRACKET

  GreaterThan = 0x3e, // GREATER-THAN SIGN
  FullwidthGreaterThan = 0xff1e, // FULLWIDTH GREATER-THAN SIGN
  CloseAngle = 0x3009, // RIGHT ANGLE BRACKET

  Period = 0x2e, // FULL STOP

  Ellipsis = 0x2026, // HORIZONTAL ELLIPSIS

        Tab = 0x9, // CHARACTER TABULATION
        LineFeed = 0xA, // LINE FEED
        VerticalTab = 0xB, // LINE TABULATION
        FormFeed = 0xC, // FORM FEED
        CarriageReturn = 0xD, // CARRIAGE RETURN
        Space = 0x20, // SPACE
        NextLine = 0x85, // NEXT LINE
        NonBreakingSpace = 0xA0, // NO-BREAK SPACE
        OghamSpace = 0x1680, // OGHAM SPACE MARK
        EnQuad = 0x2000, // EN QUAD
        EmQuad = 0x2001, // EM QUAD
        EnSpace = 0x2002, // EN SPACE
        EmSpace = 0x2003, // EM SPACE
        ThreePerEmSpace = 0x2004, // THREE-PER-EM SPACE
        FourPerEmSpace = 0x2005, // FOUR-PER-EM SPACE
        SixPerEmSpace = 0x2006, // SIX-PER-EM SPACE
        FigureSpace = 0x2007, // FIGURE SPACE
        PunctuationSpace = 0x2008, // PUNCTUATION SPACE
        ThinSpace = 0x2009, // THIN SPACE
        HairSpace = 0x200A, // HAIR SPACE
        NarrowNonBreakingSpace = 0x2024, // NARROW NO-BREAK SPACE
        LineSeparator = 0x2028, // LINE SEPARATOR
        ParagraphSeparator = 0x2029, // PARAGRAPH SEPARATOR
        MediumMathematicalSpace = 0x205F, // MEDIUM MATHEMATICAL SPACE
        IdeographicSpace = 0x3000, // IDEOGRAPHIC SPACE
}

const WHITESPACE_CHARACTERS: Set<CharacterCode> = new Set([
  CharacterCode.Tab,
  CharacterCode.LineFeed,
  CharacterCode.VerticalTab,
  CharacterCode.CarriageReturn,
  CharacterCode.Space,
  CharacterCode.NextLine,
  CharacterCode.NonBreakingSpace,
  CharacterCode.OghamSpace,
  CharacterCode.EnQuad,
  CharacterCode.EmQuad,
  CharacterCode.EnSpace,
  CharacterCode.EmSpace,
  CharacterCode.ThreePerEmSpace,
  CharacterCode.FourPerEmSpace,
  CharacterCode.SixPerEmSpace,
  CharacterCode.FigureSpace,
  CharacterCode.PunctuationSpace,
  CharacterCode.ThinSpace,
  CharacterCode.HairSpace,
  CharacterCode.NarrowNonBreakingSpace,
  CharacterCode.LineSeparator,
  CharacterCode.ParagraphSeparator,
  CharacterCode.MediumMathematicalSpace,
  CharacterCode.IdeographicSpace
]);

function isNumeric(usv: UnicodeScalarValue): boolean {
  return ( usv >= 0x30 && usv <= 0x39 );
}

function countLineBreaks(sequence: Iterable<UnicodeScalarValue>): number {
  let heldCR = false;
  let lines = 0;

  for (const usv of sequence) {
    switch (usv) {
      case CharacterCode.LineFeed:
        lines += 1;
        heldCR = false;
        break;
      case CharacterCode.CarriageReturn:
        if (heldCR) {
          lines += 1;
        };wq
        heldCR = true;
        break;
      default:
        if (heldCR) {
          lines += 1;
          heldCR = false;
        }
        break;
    }
  }
  
  return lines;
}

/**
 * Contains a mapping from Unicode Scalars to {@link TokenKind} for
 * single-character terminal symbols.
 *
 * Effectively an optimization for immediate return in Normal scan mode.
 */
export const UsvToTokenMap: Record<UnicodeScalarValue, AtomicTokenInfo["kind"]> = {
  [CharacterCode.OpenParen]: TokenKind.OpenParenthesis, // LEFT PARENTHESIS
  [CharacterCode.FullwidthOpenParen]: TokenKind.OpenParenthesis, // FULLWIDTH LEFT PARENTHESIS

  [CharacterCode.CloseParen]: TokenKind.CloseParenthesis, // RIGHT PARENTHESIS
  [CharacterCode.FullwidthCloseParen]: TokenKind.CloseParenthesis, // RIGHT PARENTHESIS

  [CharacterCode.OpenSquareBracket]: TokenKind.OpenBracket, // LEFT SQUARE BRACKET
  [CharacterCode.FullwidthOpenSquareBracket]: TokenKind.OpenBracket, // FULLWIDTH LEFT SQUARE BRACKET

  [CharacterCode.CloseSquareBracket]: TokenKind.CloseBracket, // RIGHT SQUARE BRACKET
  [CharacterCode.FullwidthCloseSquareBracket]: TokenKind.CloseBracket, // FULLWIDTH RIGHT SQUARE BRACKET

  [CharacterCode.OpenCurlyBrace]: TokenKind.OpenBrace, // LEFT CURLY BRACKET
  [CharacterCode.FullwidthOpenCurlyBrace]: TokenKind.OpenBrace, // FULLWIDTH LEFT CURLY BRACKET

  [CharacterCode.CloseCurlyBrace]: TokenKind.CloseBrace, // RIGHT CURLY BRACKET
  [CharacterCode.FullwidthCloseCurlyBrace]: TokenKind.CloseBrace, // FULLWIDTH RIGHT CURLY BRACKET

  [CharacterCode.LessThan]: TokenKind.OpenAngle, // LESS-THAN SIGN
  [CharacterCode.FullwidthLessThan]: TokenKind.OpenAngle, // FULLWIDTH LESS-THAN SIGN
  [CharacterCode.OpenAngle]: TokenKind.OpenAngle, // LEFT ANGLE BRACKET

  [CharacterCode.GreaterThan]: TokenKind.CloseAngle, // GREATER-THAN SIGN
  [CharacterCode.FullwidthGreaterThan]: TokenKind.CloseAngle, // FULLWIDTH GREATER-THAN SIGN
  [CharacterCode.CloseAngle]: TokenKind.CloseAngle, // RIGHT ANGLE BRACKET

  [CharacterCode.Period]: TokenKind.Period, // FULL STOP

  [CharacterCode.Ellipsis]: TokenKind.Ellipsis // HORIZONTAL ELLIPSIS
};

interface FileLocation {
  line: number;
  column: number;
}

/** zero indexed */
interface FileSpan {
  startLine: number;
  lineLength: number;
  startColumn: number;
  stopColumn: number;
}

function span(start: FileLocation, stop: FileLocation): FileSpan {
  return {
    startLine: start.line,
    lineLength: stop.line - start.line,
    startColumn: start.column,
    stopColumn: stop.column
  };
}

export type FileChar = string & FileLocation;

async function* positionalIterator(chars: AsyncIterable<string>): AsyncGenerator<FileChar> {
  let isEndLine = false;
  let line = 0;
  let column = 0;
  for await (const c of chars) {
    switch (c) {
      case "\r":
        isEndLine = true;
        column += 1;
        yield Object.assign(c, {
          line,
          column
        });
        break;
      case "\n":
        yield Object.assign(c, {
          line,
          column
        });
        column = 0;
        line += 1;
        isEndLine = false;
        break;
      default:
        if (isEndLine) {
          line += 1;
          column = 0;
        }
        yield Object.assign(c, {
          line,
          column
        });
        column += 1;
    }
  }
}

async function* chars(
  input: string | AsyncIterable<Buffer>,
  encoding: string = "utf-8"
): AsyncIterable<string> {
  if (typeof input === "string") {
    yield* input;
  } else {
    for await (const chunk of input) {
      yield* chunk.toString(encoding) as Iterable<string & FileLocation>;
    }
  }
}

async function collect<T>(input: AsyncIterable<T>): Promise<T[]> {
  const out = [];
  for await (const v of input) {
    out.push(v);
  }

  return out;
}

export interface ScanStatistics {}

export interface Slice<T> {
  readonly ref: T;
  readonly offset: number;
  readonly length: number;
}

export async function* tokenize(input: string | Buffer): AsyncGenerator<Token, ScanStatistics> {
  const buffer = asBuffer(input);

  const slice: (start: number, end: number) => Slice<Buffer> = (start, end) => ({
    ref: buffer,
    offset: start,
    length: end - start
  });

  const iterable = peekable(scalars(buffer));
  const iterator = iterable[Symbol.iterator]();

  while (true) {
    const [usv, offset] = iterable.peek() ?? debug.unreachable("Reached end of stream, but no EOF was encountered.");

    if (usv === -1) {
      yield {
        kind: TokenKind.EOF,
        slice: {
          ref: buffer,
          length: 0,
          offset
        }
      };
      // Done!
      return {};
    } else if (UsvToTokenMap.hasOwnProperty(usv)) {
      yield {
        kind: UsvToTokenMap[usv],
        slice: slice(offset, offset + 1)
      };
      // Consume token
      void iterator.next();
    } else {
      switch (usv) {
        // Strings
        case StringDelimiterKind.Double:
        case StringDelimiterKind.Single:
        case StringDelimiterKind.Grave:
          const str = scanString(iterator, usv);
          yield {
            kind: TokenKind.String,
            contents: str.buffer,
            delimiter: usv,
            hasInterpolationMarkers: false,
            slice: slice(offset, str.end)
          };
          break;
        // Comment
        case 0x3B: // SEMICOLON
          const [, end] = scanComment(iterator);
          yield {
            kind: TokenKind.Comment,
            slice: slice(offset, end)
          };
          break;
        // Whitespace
        default:
          if (WHITESPACE_CHARACTERS.has(usv)) {
          const { end, lines } = scanWhitespace(iterator);
          yield {
            kind: TokenKind.Whitespace,
            slice: slice(offset, end),
            newLines: lines
          };

          } else if (isNumeric(usv)) {
            const { }
          }
      }
    }
  }

  return debug.unreachable("Reached end of stream, but no EOF was encountered.");
}

type UnicodeScalarValue = number;

interface PeekableIterator<T> extends Iterable<T> {
  peek() : T | undefined;
}

function peekable<T>(iterable: Iterable<T>) : PeekableIterator<T> {
  const buffer: T[] = [];
  let final: IteratorReturnResult<T> | undefined = undefined;

  const iter = iterable[Symbol.iterator]();

  const capture = (): T | undefined => {
    if (final) {
      return undefined;
    } else {
      const next = iter.next();
      if (next.done) {
        final = next;
        return undefined;
      } else {
        buffer.push(next.value);
        return next.value;
      }
    }
  }

  return {
    peek() {
      if (buffer.length === 0) {
        return capture();
      } else {
        return buffer[buffer.length - 1];
      }
    },
    [Symbol.iterator]() {
      return {
      next: () => buffer.length === 0
        ? final !== undefined
        ? final
        : iter.next()
        : {
            done: false,
            value: buffer.pop() as T
          }
      }
    }
    }
}

/**
 * [USV, offset]
 */
export type USVElement = [UnicodeScalarValue, number];

/**
 * Implements UTF-8 decoding.
 *
 * https://encoding.spec.whatwg.org/#utf-8-decoder
 *
 * The special value -1 indicates end of file.
 *
 * @param stream A Buffer representing a UTF-8 encoded stream
 */
function* scalars(stream: Buffer): Generator<USVElement> {
  let utf8CodePoint = 0;
  let utf8BytesSeen = 0;
  let utf8BytesNeeded = 0;
  let utf8LowerBoundary = 0x80;
  let utf8UpperBoundary = 0xbf;

  let totalBytesSeen = 0;

  function fail(byte?: number) {
    debug.fail("Invalid UTF-8 stream in input", {
      byte,
      utf8BytesNeeded,
      utf8CodePoint,
      utf8BytesSeen,
      utf8LowerBoundary,
      utf8UpperBoundary
    });
  }

  for (const byte of stream) {
    if (utf8BytesNeeded === 0) {
      // 3.
      if (byte < 0) {
        debug.unreachable("Invalid negative byte in buffer");
      } else if (byte <= 0x7f) {
        // 3a.
        yield [byte, totalBytesSeen];
      } else if (byte >= 0xc2 && byte <= 0xdf) {
        // 3b.
        utf8BytesNeeded = 1;
        utf8CodePoint = byte & 0x1f;
      } else if (byte >= 0xe0 && byte <= 0xef) {
        // 3c.
        if (byte === 0xe0) {
          // 3c.1
          utf8LowerBoundary = 0xa0;
        } else if (byte === 0xed) {
          // 3c.2
          utf8UpperBoundary = 0x9f;
        }
        utf8BytesNeeded = 2;
        utf8CodePoint = byte & 0xf;
      } else if (byte >= 0xf0 && byte <= 0xf4) {
        if (byte === 0xf0) {
          utf8LowerBoundary = 0x90;
        } else if (byte === 0xf4) {
          utf8UpperBoundary = 0x8f;
        }
        utf8BytesNeeded = 3;
        utf8CodePoint = byte & 0x7;
      }
    } else if (byte < utf8LowerBoundary || byte > utf8UpperBoundary) {
      fail(byte);
    } else {
      utf8LowerBoundary = 0x80;
      utf8UpperBoundary = 0xbf;
      utf8CodePoint = (utf8CodePoint << 6) | (byte & 0x3f);
      utf8BytesSeen += 1;
      if (utf8BytesSeen === utf8BytesNeeded) {
        yield [utf8CodePoint, totalBytesSeen];
        utf8CodePoint = 0;
        utf8BytesNeeded = 0;
        utf8BytesSeen = 0;
      }
    }

    totalBytesSeen += 1;
  }

  // 1.
  // 2.
  if (utf8BytesNeeded !== 0) {
    fail();
  }

  yield [-1, totalBytesSeen];
}

function asBuffer(input: string | Buffer): Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  } else {
    return Buffer.from(input, "utf-8");
  }
}

export async function parse(contents: string | Buffer): Promise<Module> {
  console.log(await collect(tokenize(contents)));
  process.exit(0);
}
