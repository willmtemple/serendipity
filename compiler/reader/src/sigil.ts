import { CharacterCode } from "./unicode";

const _sigils: Map<string, symbol> = new Map();

export const intern = (sigil: string) =>
  _sigils.get(sigil) ??
  (() => {
    const s = Symbol(sigil);
    _sigils.set(sigil, s);
    return s;
  })();

export const Sigils = {
  Arrow: intern("->"),
  BigArrow: intern("=>"),
  SingleColon: intern(":"),
  DoubleColon: intern("::"),
  Pipe: intern("|"),
  Comma: intern(","),
  Semicolon: intern(";"),
  ColonEqual: intern(":="),
  ColonEqualEqual: intern(":=="),
  Tilde: intern("~"),
  Ampersand: intern("&"),
  At: intern("@"),
};

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
