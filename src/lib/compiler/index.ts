import { error, Result, matchResult, ok } from "../util/Result";
import { Diagnostic } from "./diagnostic";


export type CompilerOutput<T> = Result<T, Diagnostic[]>;

export interface CompilerPass<Input, Output> {
    run(i: Input) : CompilerOutput<Output>;
}

export class Compiler<Input, Output> {
    private passes: any[];
    private final: boolean;

    constructor(pass: CompilerPass<Input, Output>) {
        this.final = false;
        this.passes = [pass];
    }

    compile(input: Input) : CompilerOutput<Output> {
        if (this.final) {
            throw new Error("This compiler is already finalized.");
        }

        this.final = true;

        let state = input as any;

        for (const pass of this.passes) {
            const res = pass.run(state) as CompilerOutput<any>;
            if (res.kind === "error") {
                return res;
            }
            state = res.value;
        }

        return ok(state as Output);
    }

    then<T>(pass: CompilerPass<Output, T>) : Compiler<Input, T> {
        this.passes.push(pass);
        return (this as unknown) as Compiler<Input, T>;
    }
}