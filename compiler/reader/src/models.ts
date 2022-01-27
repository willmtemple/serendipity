// Copyright (c) Will Temple
// Licensed under the MIT license.

import { factory } from "omnimatch";
import { BigNumber } from "bignumber.js";

import { Range } from "./codePointIterator";

export type LexicalElement = Readonly<Compound | LexicalAtom>;

export interface LexicalElementCommon {
  alt?: boolean;
  metadata?: {
    precededByWhitespace?: boolean;
    range: Range;
  };
}

type Compound = LexicalList | LexicalArray;

export const enum LexicalKind {
  List = "list",
  Array = "array",
  Sigil = "sigil",
  Symbol = "symbol",
  String = "string",
  Number = "number",
}

/**
 * A Lexical list, a sequence of expressions.
 */
export interface LexicalList extends LexicalElementCommon {
  kind: LexicalKind.List;
  values: LexicalElement[];
}

/**
 * The type of a lexical array, referring to expression sequences enclosed in square brackets,
 * separated by commas.
 *
 * Alt: Separation is by semicolons instead of by commas.
 *
 * [1 + 2, 2, 3, 4]
 * #[let x = 5; print x]
 * { a => 1, b, c }
 * #{ a => string; x => number }
 */
export interface LexicalArray extends LexicalElementCommon {
  kind: LexicalKind.Array;
  /**
   * The type of delimiter enclosing this array, either:
   * - "square" (for square brackets, [])
   * - "curly" (for curly braces, {})
   */
  delimiter: "square" | "curly";
  values: LexicalElement[][];
}

/**
 * Simple/primitive types that are leaves in the lexical expression
 * tree.
 */
export type LexicalAtom = SymbolAtom | StringAtom | NumberAtom | SigilAtom;

/**
 * A symbol, or a basic contiguous "word" suitible for use as an identifier.
 */
export interface SymbolAtom extends LexicalElementCommon {
  kind: "symbol";
  symbolName: string;
}

/**
 * A sigil, or a contiguous sequence of non-alphanumeric characters.
 */
export interface SigilAtom extends LexicalElementCommon {
  kind: LexicalKind.Sigil;
  sigil: symbol;
}

/**
 * A string, or an arbitrary buffer of UTF-8 encoded bytes.
 */
export interface StringAtom extends LexicalElementCommon {
  kind: LexicalKind.String;
  contents: Uint8Array;
}

/**
 * A numeric value.
 */
export interface NumberAtom extends LexicalElementCommon {
  kind: LexicalKind.Number;
  value: BigNumber;
}

export const make = factory<LexicalElement>();
