// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { debug } from "./utils.js";

export type UnicodeScalarValue = number;

/**
 * Produces the code point of a number's character.
 *
 * @param n a number from zero to nine
 */
export function numeral(n: number): number {
  if (n < 0 || n > 15) {
    throw new RangeError("numeral index out of bounds");
  }

  return Math.trunc(n <= 9 ? 48 + n : 65 + (n - 10));
}

export const NUMERALS = new Set([
  // DIGIT 0-9
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
  // CAPITAL A-F
  0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
  // SMALL a-f
  0x61, 0x62, 0x63, 0x64, 0x65, 0x66,
]);

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

  // == PUNCTUATION ==

  Comma = 0x2c, // COMMA
  Period = 0x2e, // FULL STOP
  Colon = 0x3a,
  Semicolon = 0x3b, // SEMICOLON

  Ellipsis = 0x2026, // HORIZONTAL ELLIPSIS

  SingleQuote = 0x27, // APOSTROPHE
  DoubleQuote = 0x22, // QUOTATION MARK

  Backtick = 0x60, // GRAVE ACCENT

  ExclamationMark = 0x21, // EXCLAMATION MARK
  QuestionMark = 0x3f, // QUESTION MARK
  Pipe = 0x7c, // VERTICAL LINE
  Underscore = 0x5f, // LOW LINE

  // == UTILITY ==

  NumberSign = 0x23, // NUMBER SIGN
  DollarSign = 0x24, // DOLLAR SIGN
  ForwardSlash = 0x2f, // SOLIDUS
  Backslash = 0x5c, // REVERSE SOLIDUS
  Asterisk = 0x2a, // ASTERISK
  PlusSign = 0x2b, // PLUS SIGN
  MinusSign = 0x2d, // HYPHEN-MINUS
  EqualsSign = 0x3d, // EQUALS SIGN
  AtSign = 0x40, // COMMERCIAL AT
  PercentSign = 0x25, // PERCENT SIGN
  Caret = 0x5e, // CIRCUMFLEX ACCENT
  Ampersand = 0x26, // AMPERSAND

  // == TEXT ==
  LowercaseLetterN = 0x4e, // LATIN SMALL LETTER N

  // == WHITESPACE ==

  Tab = 0x9, // CHARACTER TABULATION
  LineFeed = 0xa, // LINE FEED
  VerticalTab = 0xb, // LINE TABULATION
  FormFeed = 0xc, // FORM FEED
  CarriageReturn = 0xd, // CARRIAGE RETURN
  Space = 0x20, // SPACE
  NextLine = 0x85, // NEXT LINE
  NonBreakingSpace = 0xa0, // NO-BREAK SPACE
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
  HairSpace = 0x200a, // HAIR SPACE
  NarrowNonBreakingSpace = 0x2024, // NARROW NO-BREAK SPACE
  LineSeparator = 0x2028, // LINE SEPARATOR
  ParagraphSeparator = 0x2029, // PARAGRAPH SEPARATOR
  MediumMathematicalSpace = 0x205f, // MEDIUM MATHEMATICAL SPACE
  IdeographicSpace = 0x3000, // IDEOGRAPHIC SPACE
}

export const WHITESPACE_CHARACTERS: Set<CharacterCode> = new Set([
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
  CharacterCode.IdeographicSpace,
]);

export function isNumeric(usv: UnicodeScalarValue): boolean {
  return usv >= 0x30 && usv <= 0x39;
}

export function utf8Encode(c: number): number[] {
  if (c < 0x80) {
    return [(c & 0x7f) | 0x00];
  } else if (c < 0x800) {
    return [((c >> 6) & 0x1f) | 0xc0, (c & 0x3f) | 0x80];
  } else if (c < 0x10000) {
    return [((c >> 12) & 0x0f) | 0xe0, ((c >> 6) & 0x3f) | 0x80, (c & 0x3f) | 0x80];
  } else if (c < 0x110000) {
    return [
      ((c >> 18) & 0x07) | 0xf0,
      ((c >> 12) & 0x3f) | 0x80,
      ((c >> 6) & 0x3f) | 0x80,
      (c & 0x3f) | 0x80,
    ];
  } else {
    throw new Error(`Invalid input (not a code point): 0x${c.toString(16)}`);
  }
}

/**
 * Implements UTF-8 decoding.
 *
 * https://encoding.spec.whatwg.org/#utf-8-decoder
 *
 * @param stream A Buffer representing a UTF-8 encoded stream
 */
export async function* scalars(stream: AsyncIterable<number>): AsyncIterable<UnicodeScalarValue> {
  let utf8CodePoint = 0;
  let utf8BytesSeen = 0;
  let utf8BytesNeeded = 0;
  let utf8LowerBoundary = 0x80;
  let utf8UpperBoundary = 0xbf;

  function fail(byte?: number): never {
    return debug.fail("Invalid UTF-8 stream in input", {
      byte,
      utf8BytesNeeded,
      utf8CodePoint,
      utf8BytesSeen,
      utf8LowerBoundary,
      utf8UpperBoundary,
    });
  }

  for await (const byte of stream) {
    if (utf8BytesNeeded === 0) {
      // 3.
      if (byte < 0) {
        return debug.unreachable("Invalid negative byte in buffer");
      } else if (byte <= 0x7f) {
        // 3a.
        yield byte;
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
        yield utf8CodePoint;
        utf8CodePoint = 0;
        utf8BytesNeeded = 0;
        utf8BytesSeen = 0;
      }
    }
  }

  // 1.
  // 2.
  if (utf8BytesNeeded !== 0) {
    fail();
  }
}
