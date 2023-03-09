export * from "./index.gen";
import * as bg from "../dist-bundler/serendipity_parser";

import { Module, ParsedDocument, ParseNode } from "./index.gen";

export function parse(
  input: string | Uint8Array
): ParsedDocument<ParseNode<Module>> {
  if (typeof input === "string") {
    return bg.parse_bytes(new TextEncoder().encode(input));
  } else if (input instanceof Uint8Array) {
    return bg.parse_bytes(input);
  } else {
    throw new Error("unsupported input, try 'Uint8Array' or 'string'");
  }
}

export function printParse(input: string | Uint8Array): string {
  if (typeof input === "string") {
    return bg.print_parse(new TextEncoder().encode(input));
  } else if (input instanceof Uint8Array) {
    return bg.print_parse(input);
  } else {
    throw new Error("unsupported input, try 'Uint8Array' or 'string'");
  }
}
