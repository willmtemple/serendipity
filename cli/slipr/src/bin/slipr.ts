// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/* eslint-disable no-console */

import "source-map-support/register";

import * as fs from "fs";

import * as fsPromises from "fs/promises";

import * as readlineSync from "readline-sync";

import { createLoweringCompiler, getAssociatedExports } from "@serendipity/compiler-desugar";
import { Interpreter, InterpreterOptions } from "@serendipity/interpreter";
import { writeAbstract } from "@serendipity/interpreter/dist-esm/print";
import { unwrap, ok } from "@serendipity/syntax/dist-esm/util/Result";

import { Module, Expression } from "@serendipity/syntax-abstract";

import { CompilerOutput } from "@serendipity/syntax";

import { parse, printParse } from "@serendipity/parser";
import path from "path";

async function main(): Promise<void> {
  const fn = process.argv[2];
  const canonicalizedPath = path.resolve(fn);

  const stream = fs.createReadStream(fn);

  const chunks: Uint8Array[] = [];

  stream.on("data", (c) => {
    chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  });

  const buffer = await new Promise<Uint8Array>((resolve) => {
    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });

  const parseTree = parse(buffer);

  if (process.env.DEBUG) {
    console.log(printParse(buffer));
  }

  const compiler = createLoweringCompiler().then({
    run(out: Module): CompilerOutput<Module> {
      //return ok(removeUnusedFunctionCalls(out));
      return ok(out);
    },
  });

  if (parseTree.error || parseTree.result === undefined) {
    for (const diagnostic of parseTree.diagnostics) {
      const loc = Array.isArray(diagnostic.location) ? diagnostic.location[0] : diagnostic.location;
      console.log(fn + ":" + (loc ? `${loc.line + 1}:${loc.column + 1}` :"<unk>"), "-", diagnostic.message);
    }
    process.exit(1);
  }

  const program = unwrap(compiler.compile(parseTree.result.value));

  const options: Partial<InterpreterOptions> = {
    getAssociatedExports: getAssociatedExports,
    corePath: path.resolve(__dirname, "../../node_modules/@serendipity/core/lib.sdp"),
    async loadModule(path) {
      const moduleText = (await fsPromises.readFile(path)).toString("utf-8");

      const parsed = parse(moduleText);

      if (process.env.DEBUG) {
        console.log(printParse(moduleText));
      }

      if (parsed.error || parsed.result === undefined) {
        for (const diagnostic of parsed.diagnostics) {
          const loc = Array.isArray(diagnostic.location) ? diagnostic.location[0] : diagnostic.location;
          console.log(fn + ":" + (loc ? `${loc.line + 1}:${loc.column + 1}` :"<unk>"), "-", diagnostic.message);
        }
        process.exit(1);
      }

      const compiler = createLoweringCompiler().then({
        run(out: Module): CompilerOutput<Module> {
          //return ok(removeUnusedFunctionCalls(out));
          return ok(out);
        },
      });

      const m = unwrap(compiler.compile(parsed.result.value));

      return m;
    },
    printer(s: string) {
      process.stdout.write(s + "\n");
    },
    prompt(s?: string) {
      if (s) {
        return readlineSync.question(s);
      } else {
        return readlineSync.question();
      }
    },
  };

  if (process.env.DEBUG) {
    options.beforeEval = (expr: Expression) => {
      console.info("[eval]", writeAbstract(expr));
    };
  }

  const interpreter = new Interpreter(options);

  interpreter.execModule(program, canonicalizedPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
