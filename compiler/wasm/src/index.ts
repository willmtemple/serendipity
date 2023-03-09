import {
  createLoweringCompiler,
  lowerModule,
} from "@serendipity/compiler-desugar";
import { Module as SurfaceModule } from "@serendipity/parser";
import { Module as AbstractModule } from "@serendipity/syntax-abstract";
import { Compiler, CompilerOutput } from "@serendipity/syntax";

export function toWasm(module: AbstractModule): CompilerOutput<Uint8Array> {
  return {
    kind: "ok",
    value: new Uint8Array(),
  };
}

export function createWasmCompiler(): Compiler<SurfaceModule, Uint8Array> {
  return createLoweringCompiler().then({
    run: toWasm,
  });
}
