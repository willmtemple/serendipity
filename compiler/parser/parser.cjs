const bg = require("./dist-cjs/serendipity_parser");

module.exports = {
    parse(input) {
        if (typeof input === "string") {
            return bg.parse_bytes(new TextEncoder().encode(input));
        } else if (input instanceof Uint8Array) {
            return bg.parse_bytes(input);
        } else {
            throw new Error("unsupported input, try 'Uint8Array' or 'string'");
        }
    }
}