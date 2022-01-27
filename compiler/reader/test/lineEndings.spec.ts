import { assert } from "chai";
import { normalizeLineEndings } from "../src/crlf";
import { scalars } from "../src/unicode";
import { asBuffer, cat, map } from "../src/utils";

export const expectations: Record<string, string> = {
  "\r\n": "\n",
  "\n\r": "\n\n",
  "\n\r\n": "\n\n",
  "\r\n\n": "\n\n",
  "\n\ra\n": "\n\na\n",
  "\r\na\n": "\na\n",
  "\n\ra\na": "\n\na\na",
  "\r\na\na": "\na\na",
  "\r": "\n",
  "\r\r\n": "\n\n",
  "\r\r": "\n\n",
  "": "",
  asdf: "asdf",
};

async function collect(stream: AsyncIterable<number>): Promise<string> {
  const accum = [];

  for await (const it of stream) {
    accum.push(it);
  }

  return String.fromCodePoint(...accum);
}

function printable(v: string): string {
  return v.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}

describe("line ending normalization", function () {
  for (const [input, expectation] of Object.entries(expectations)) {
    it(printable(input), async () => {
      async function* gen() {
        yield input;
      }
      const output = normalizeLineEndings(scalars(cat(map(gen(), asBuffer))));
      assert.strictEqual(await collect(output), expectation);
    });
  }
});
