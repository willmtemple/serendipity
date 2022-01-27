import { assert } from "chai";
import { numeral } from "../src/unicode";

describe("numeral conversions", () => {
  it("from number to numeral", () => {
    assert.strictEqual(numeral(0), 0x30);
    assert.strictEqual(numeral(1), 0x31);
    assert.strictEqual(numeral(2), 0x32);
    assert.strictEqual(numeral(3), 0x33);
    assert.strictEqual(numeral(4), 0x34);
    assert.strictEqual(numeral(5), 0x35);
    assert.strictEqual(numeral(6), 0x36);
    assert.strictEqual(numeral(7), 0x37);
    assert.strictEqual(numeral(8), 0x38);
    assert.strictEqual(numeral(9), 0x39);
    assert.strictEqual(numeral(10), 0x41);
    assert.strictEqual(numeral(11), 0x42);
    assert.strictEqual(numeral(12), 0x43);
    assert.strictEqual(numeral(13), 0x44);
    assert.strictEqual(numeral(14), 0x45);
    assert.strictEqual(numeral(15), 0x46);
  });
});
