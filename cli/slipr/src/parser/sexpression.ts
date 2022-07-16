// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

export type Atom = string | number;

export type SExpression = Atom | SExpressionArray;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SExpressionArray extends Array<SExpression> {}

const LIST_MARKERS = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
];

const FLAT_LIST_MARKERS = LIST_MARKERS.reduce((v, acc) => [...acc, ...v], []);
const LIST_MARKER_LOOKUP = (() => {
  const result: { [k: string]: string } = {};
  LIST_MARKERS.forEach((markers) => (result[markers[0]] = markers[1]));
  return result;
})();

export async function* chars(
  input: AsyncIterable<Buffer>,
  encoding: BufferEncoding = "utf-8"
): AsyncGenerator<string> {
  for await (const chunk of input) {
    for (const c of chunk.toString(encoding)) {
      yield c;
    }
  }
}

/* const rSymbol = /^[a-z_][a-zA-Z0-9_\-?!]*$/;
const rNumeric = /^(0[xdob])?[0-9]+$/;
const rString = /^".*"$/;
const rMultiLineString = /^`.*`/s;*/

/**
 *
 * @param input an iterator over chunks of inpu
 */
export async function* tokenize(input: AsyncIterable<string>): AsyncGenerator<string> {
  let accum = "";
  let waitFor: string | undefined;

  const clear = (): void => {
    accum = "";
    waitFor = undefined;
  };

  for await (const c of input) {
    if (waitFor) {
      if (c === "\n") {
        if (waitFor === "\n") {
          clear();
        } else {
          throw new Error("Found newline while scanning for end of quoted literal.");
        }
      } else if (c === waitFor) {
        accum += waitFor;
        yield accum;
        clear();
      } else {
        accum += c;
      }
    } else if (/\s/.exec(c)) {
      // Whitespace
      if (accum !== "") {
        yield accum;
        clear();
      }
    } else if (c === '"') {
      accum += c;
      waitFor = c;
    } else if (c === ";") {
      waitFor = "\n";
    } else if (FLAT_LIST_MARKERS.includes(c)) {
      if (accum !== "") {
        yield accum;
        clear();
      }
      yield c;
    } else {
      accum += c;
    }
  }

  if (accum !== "") {
    yield accum;
  }
}

export const oldTokenize = (input: string): string[] => {
  const expanded = FLAT_LIST_MARKERS.reduce(
    (acc, marker) => acc.replace(new RegExp("\\" + marker, "gi"), ` ${marker} `),
    input
  );
  return expanded.split(/\s/);
};

export const atomize = (tokens: string[]): Atom[] =>
  tokens
    .filter((txt) => txt !== "")
    .map((tok) => {
      const maybeNumber = Number(tok);
      return !isNaN(maybeNumber) ? maybeNumber : tok;
    });

export function intoSExpression(atoms: Atom[]): SExpressionArray {
  const markerStack: Array<[string, SExpression[]]> = [];
  const result: SExpressionArray = [];

  let acc = result;

  for (const atom of atoms) {
    switch (atom) {
      case "(":
      case "[":
      case "{":
        markerStack.push([LIST_MARKER_LOOKUP[atom], acc]);
        acc = [];
        break;
      case ")":
      case "]":
      case "}":
        if (markerStack[markerStack.length - 1][0] !== atom) {
          throw new Error(
            "Mismatched brackets. We should make this error return some information."
          );
        } else {
          markerStack[markerStack.length - 1][1].push(acc);
          acc = markerStack.pop()![1];
        }
        break;
      default:
        acc.push(atom);
    }
  }

  if (markerStack.length !== 0) {
    throw new Error(`Unmatched closing brackets: ` + markerStack);
  }

  return result;
}
