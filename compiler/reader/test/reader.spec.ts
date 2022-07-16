import BigNumber from "bignumber.js";
import { assert } from "chai";
import { match } from "omnimatch";

import { makeReader, Reader } from "../src/reader";
import {
  LexicalArray,
  LexicalElement,
  LexicalKind,
  LexicalList,
  NumberAtom,
  SigilAtom,
  StringAtom,
  SymbolAtom,
} from "../src/models";
import { WHITESPACE_CHARACTERS } from "../src/unicode";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const accum = [];
  for await (const v of iter) {
    accum.push(v);
  }

  return accum;
}

function collectSync<T>(iter: Iterable<T>): T[] {
  const accum = [];
  for (const v of iter) {
    accum.push(v);
  }
  return accum;
}

async function* stream(input: string) {
  yield input;
}

const emptyModules = ["", " ", " \n ", "\n", "\r\n", "\n\r", " \r  "];

function* to(n: number) {
  for (let i = 0; i < n; i += 1) {
    yield i;
  }
}

const whitespaces = Array.from(WHITESPACE_CHARACTERS);

declare global {
  interface Math {
    randInt(max: number, min?: number): number;
  }
}

Math.randInt = function (max: number, min: number = 0) {
  return Math.floor(Math.random() * max + min);
};

function ws(): string {
  let accum = " ";
  for (const _ in to(Math.randInt(20))) {
    accum += whitespaces[Math.randInt(whitespaces.length)];
  }

  return accum;
}

const simpleExpectations: Record<string, LexicalElement[]> = {
  [`${ws()}`]: [],
  [`${ws()}//comment`]: [],
  [`${ws()}/*  comment a*/`]: [],
  [`${ws()}a`]: [{ kind: LexicalKind.Symbol, symbolName: "a" }],
  [`${ws()}a${ws()}`]: [{ kind: LexicalKind.Symbol, symbolName: "a" }],
  [`${ws()}(b)${ws()}`]: [
    { kind: LexicalKind.List, values: [{ kind: LexicalKind.Symbol, symbolName: "b" }] },
  ],
  [`${ws()}(b${ws()})${ws()}`]: [
    { kind: LexicalKind.List, values: [{ kind: LexicalKind.Symbol, symbolName: "b" }] },
  ],
  [`${ws()}(${ws()}b)${ws()}`]: [
    { kind: LexicalKind.List, values: [{ kind: LexicalKind.Symbol, symbolName: "b" }] },
  ],
  [`${ws()}(${ws()}ab${ws()})${ws()}`]: [
    { kind: LexicalKind.List, values: [{ kind: LexicalKind.Symbol, symbolName: "ab" }] },
  ],
  [`${ws()}[cx]${ws()}`]: [
    {
      kind: LexicalKind.Array,
      delimiter: "square",
      values: [[{ kind: LexicalKind.Symbol, symbolName: "cx" }]],
    },
  ],
  [`${ws()}[av${ws()}]${ws()}`]: [
    {
      kind: LexicalKind.Array,
      delimiter: "square",
      values: [[{ kind: LexicalKind.Symbol, symbolName: "av" }]],
    },
  ],
  [`${ws()}[${ws()}wxs]${ws()}`]: [
    {
      kind: LexicalKind.Array,
      delimiter: "square",
      values: [[{ kind: LexicalKind.Symbol, symbolName: "wxs" }]],
    },
  ],
  [`${ws()}[${ws()}asdfasdf${ws()}]${ws()}`]: [
    {
      kind: LexicalKind.Array,
      delimiter: "square",
      values: [[{ kind: LexicalKind.Symbol, symbolName: "asdfasdf" }]],
    },
  ],
  [`${ws()}""${ws()}`]: [{ kind: LexicalKind.String, contents: new Uint8Array([]) }],
  [`${ws()}"a"${ws()}`]: [{ kind: LexicalKind.String, contents: new Uint8Array([0x61]) }],
  [`${ws()}"abcd"${ws()}`]: [
    { kind: LexicalKind.String, contents: new Uint8Array([0x61, 0x62, 0x63, 0x64]) },
  ],
  [`${ws()}"á"${ws()}`]: [{ kind: LexicalKind.String, contents: new Uint8Array([0xc3, 0xa1]) }],
  [`${ws()}("")${ws()}`]: [
    {
      kind: LexicalKind.List,
      values: [{ kind: LexicalKind.String, contents: new Uint8Array([]) }],
    },
  ],
  [`${ws()}["a"]${ws()}`]: [
    {
      kind: LexicalKind.Array,
      delimiter: "square",
      values: [[{ kind: LexicalKind.String, contents: new Uint8Array([0x61]) }]],
    },
  ],
  [`${ws()}( "abcd")${ws()}`]: [
    {
      kind: LexicalKind.List,
      values: [{ kind: LexicalKind.String, contents: new Uint8Array([0x61, 0x62, 0x63, 0x64]) }],
    },
  ],
  [`${ws()}("á" )${ws()}`]: [
    {
      kind: LexicalKind.List,
      values: [{ kind: LexicalKind.String, contents: new Uint8Array([0xc3, 0xa1]) }],
    },
  ],
  [`${ws()}//comment\n${ws()}"//"${ws()}`]: [
    { kind: LexicalKind.String, contents: new Uint8Array([0x2f, 0x2f]) },
  ],
  [`${ws()}/*  comment a\n*/\n${ws()}"//"${ws()}`]: [
    { kind: LexicalKind.String, contents: new Uint8Array([0x2f, 0x2f]) },
  ],
  [`${ws()}25${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber(25) }],
  [`${ws()}25.5${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber("25.5") }],
  [`${ws()}0x25.5${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber("0x25.5") }],
  [`${ws()}0x25.5${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber("25.5", 16) }],
  [`${ws()}0xA1${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber(161) }],
  [`${ws()}0o664${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber(436) }],
  [`${ws()}0b11111111${ws()}`]: [{ kind: LexicalKind.Number, value: new BigNumber("0xFF") }],
};

declare global {
  namespace Chai {
    interface AssertStatic {
      same: (left: unknown, right: unknown) => void;
    }
  }
}

assert.same = function (left: unknown, right: unknown): void {
  if (Object.prototype.hasOwnProperty.call(left, "kind")) {
    assert.isTrue(Object.prototype.hasOwnProperty.call(right, "kind"));
    assert.strictEqual((left as LexicalElement).kind, (right as LexicalElement).kind);
    // Both are LexicalElement
    match(left as LexicalElement, {
      list: ({ values }) => {
        const r = right as LexicalList;
        assert.strictEqual(values.length, r.values.length);
        zip(values, r.values).forEach(([lV, rV]) => assert.same(lV, rV));
      },
      array: ({ values, delimiter, alt }) => {
        const r = right as LexicalArray;
        assert.strictEqual(alt, r.alt);
        assert.strictEqual(delimiter, r.delimiter);
        const lVals = collectSync(values);
        const rVals = collectSync(r.values);
        assert.strictEqual(lVals.length, rVals.length);
        zip(lVals, rVals).forEach(([lV, rV]) => {
          assert.same(lV, rV);
        });
      },
      number: ({ value }) => {
        const r = right as NumberAtom;
        assert.isTrue(r.value.eq(value));
      },
      symbol: ({ symbolName }) => {
        const r = right as SymbolAtom;
        assert.strictEqual(symbolName, r.symbolName);
      },
      sigil: ({ sigil }) => {
        const r = right as SigilAtom;
        assert.strictEqual(sigil, r.sigil);
      },
      string: ({ contents }) => {
        const r = right as StringAtom;
        assert.isTrue(zip(Array.from(contents), Array.from(r.contents)).every(([l, r]) => l === r));
      },
    });
  } else if (Array.isArray(left)) {
    assert.isTrue(Array.isArray(right));
    const l = left as unknown[];
    const r = right as unknown[];
    zip(l, r).forEach(([lE, rE]) => {
      assert.same(lE, rE);
    });
  } else {
    console.error("Unimplemented assert.same comparison");
    console.error("Left:", left);
    console.error("Right:", right);
    throw new Error(`unimplemented assert.same comparison:`);
  }
};

function zip<T1, T2>(arr1: T1[], arr2: T2[]): Array<[T1, T2]> {
  const accum: Array<[T1, T2]> = [];
  for (let idx = 0; idx < arr1.length; idx++) {
    accum.push([arr1[idx]!, arr2[idx]!]);
  }

  return accum;
}

describe("reader", () => {
  let read: Reader;

  beforeEach(() => {
    read = makeReader();
  });

  it("empty modules", async () => {
    for (const m of await Promise.all(emptyModules.map((m) => collect(read(stream(m)))))) {
      assert.isEmpty(m);
    }
  });

  function readable(input: string): string {
    return input.replace("\n", "\\n").replace("\r", "\\r").replace(/\s+/g, "\\s");
  }

  describe("simple modules", () => {
    let idx: number = 0;
    for (const [input, expectation] of Object.entries(simpleExpectations)) {
      it(`${idx + 1} <<<${readable(input)}>>>`, async () => {
        const module = await collect(read(stream(input)));

        for (const [left, right] of zip(module, expectation)) {
          assert.same(left, right);
        }
      });
      idx += 1;
    }
  });
});
