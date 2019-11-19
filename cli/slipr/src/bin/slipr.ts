// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/* eslint-disable no-console */

import * as fs from "fs";

import { createLoweringCompiler } from "@serendipity/compiler-desugar";
import { Interpreter } from "@serendipity/interpreter";
import { unwrap } from "@serendipity/syntax/dist/util/Result";

import defaultParser from "../parser";

async function main(): Promise<void> {
  const fn = process.argv[2];

  const stream = fs.createReadStream(fn);

  const parseTree = await defaultParser.parse(stream);

  const compiler = createLoweringCompiler();

  const program = unwrap(compiler.compile(parseTree));

  const interpreter = new Interpreter((s: string) => {
    process.stdout.write(s + "\n");
  });

  interpreter.execModule(program);
}

main().catch((e) => {
  console.error(`Error: ${e}`);
  process.exit(1);
});
