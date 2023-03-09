// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Result, ok } from "../util/Result";
import { Diagnostic } from "./diagnostic";

export type CompilerOutput<T> = Result<T, Diagnostic[]>;

export interface CompilerPass<Input, Output> {
  run(i: Input): CompilerOutput<Output>;
}

export class Compiler<Input, Output> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private passes: any[];
  private final: boolean;

  public constructor(pass: CompilerPass<Input, Output>) {
    this.final = false;
    this.passes = [pass];
  }

  public compile(input: Input): CompilerOutput<Output> {
    if (this.final) {
      throw new Error("This compiler is already finalized.");
    }

    this.final = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let state = input as any;

    for (const pass of this.passes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = pass.run(state) as CompilerOutput<any>;
      
      if (res.kind === "error") {
        return res;
      }

      state = res.value;
    }

    return ok(state as Output);
  }

  public then<T>(pass: CompilerPass<Output, T>): Compiler<Input, T> {
    this.passes.push(pass);
    return (this as unknown) as Compiler<Input, T>;
  }
}
