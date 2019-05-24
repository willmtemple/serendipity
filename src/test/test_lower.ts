import { surfaceExample } from "./examples";
import { unwrap } from "../lib/util/Result";
import { execModule } from "./interp/eval";
import { writeGlobal } from "../lib/printer/surface";
import { createLoweringCompiler } from "./lower";

const compiler = createLoweringCompiler();

process.stdout.write(surfaceExample.globals.map((g) => writeGlobal(g)).join("\n\n") + "\n==\n");

const res = unwrap(compiler.compile(surfaceExample));

execModule(res);