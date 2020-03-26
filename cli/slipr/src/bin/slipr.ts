// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/* eslint-disable no-console */

import * as fs from "fs";

import * as readlineSync from "readline-sync";

import { createLoweringCompiler } from "@serendipity/compiler-desugar";
import { Interpreter, InterpreterOptions } from "@serendipity/interpreter";
import { writeAbstract } from "@serendipity/interpreter/dist-esm/print";
import { unwrap, ok } from "@serendipity/syntax/dist-esm/util/Result";

import { Module, Expression } from "@serendipity/syntax-abstract";

import defaultParser from "../parser";
import { removeUnusedFunctionCalls } from "../optimizers/deadCode";
import { CompilerOutput } from "@serendipity/syntax";

async function main(): Promise<void> {
  const fn = process.argv[2];

  const stream = fs.createReadStream(fn);

  const parseTree = await defaultParser.parse(stream);

  const compiler = createLoweringCompiler().then({
    run(out: Module): CompilerOutput<Module> {
      return ok(removeUnusedFunctionCalls(out));
    }
  });

  const program = unwrap(compiler.compile(parseTree));

  const options: Partial<InterpreterOptions> = {
    printer(s: string) {
      process.stdout.write(s + "\n");
    },
    prompt(s?: string) {
      if (s) {
        return readlineSync.question(s);
      } else {
        return readlineSync.question();
      }
    }
  };

  if (process.env.DEBUG) {
    options.beforeEval = (expr: Expression) => {
      console.info("[eval]", writeAbstract(expr));
    };
  }

  const interpreter = new Interpreter(options);

  interpreter.execModule(program);
}

main().catch((e) => {
  console.error(`Error: ${e}`);
  process.exit(1);
});
