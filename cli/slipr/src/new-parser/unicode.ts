// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { debug } from "./utils";

export type UnicodeScalarValue = number;

export const enum CharacterCode {
  EOF = -1,

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

  // == UTILITY ==

  NumberSign = 0x23, // NUMBER SIGN
  DollarSign = 0x24, // DOLLAR SIGN
  ForwardSlash = 0x2f, // SOLIDUS
  Backslash = 0x5c, // REVERSE SOLIDUS
  Asterisk = 0x2a, // ASTERISK

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
  IdeographicSpace = 0x3000 // IDEOGRAPHIC SPACE
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
  CharacterCode.IdeographicSpace
]);

export function isNumeric(usv: UnicodeScalarValue): boolean {
  return usv >= 0x30 && usv <= 0x39;
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
      utf8UpperBoundary
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
