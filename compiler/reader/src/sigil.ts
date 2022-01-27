import { CharacterCode } from "./unicode";

const _sigils: Map<string, symbol> = new Map();

export const Sigils: Record<string, symbol> = {
  Arrow: intern("->"),
  BigArrow: intern("=>"),
  SingleColon: intern(":"),
  DoubleColon: intern("::"),
  Pipe: intern("|"),
  Comma: intern(","),
  Semicolon: intern(";"),
  ColonEqualEqual: intern(":=="),
  Tilde: intern("~"),
  Ampersand: intern("&"),
  At: intern("@"),
};

export function intern(sigil: string): symbol {
  if (_sigils.has(sigil)) {
    return _sigils.get(sigil)!;
  } else {
    const s = Symbol(sigil);
    _sigils.set(sigil, s);
    return s;
  }
}

export const SIGIL_CHARACTERS = new Set<CharacterCode>([
  CharacterCode.ExclamationMark,
  CharacterCode.AtSign,
  CharacterCode.NumberSign,
  CharacterCode.DollarSign,
  CharacterCode.PercentSign,
  CharacterCode.Caret,
  CharacterCode.Ampersand,
  CharacterCode.Asterisk,
  CharacterCode.MinusSign,
  CharacterCode.PlusSign,
  CharacterCode.EqualsSign,
  CharacterCode.Colon,
  CharacterCode.Semicolon,
  CharacterCode.Comma,
  CharacterCode.Period,
  CharacterCode.LessThan,
  CharacterCode.GreaterThan,
  CharacterCode.Pipe,
  CharacterCode.ForwardSlash,
  CharacterCode.Backslash,
  CharacterCode.QuestionMark,
]);
