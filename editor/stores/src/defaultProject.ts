// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Module, Global, makeExpr, Statement } from "@serendipity/syntax-surface";

import { factory } from "omnimatch";

const { Define, DefineFunction, Main } = factory<Global>();
const { Accessor, Arithmetic, Call, Compare, If, Name, Number, Procedure, Tuple, Void } = makeExpr;
const { ForIn, Print } = factory<Statement>();

export const surfaceExample: Module = {
  globals: [
    Define({
      name: "recList",
      value: Tuple(Number(1), Name("recList"))
    }),
    DefineFunction({
      name: "take",
      parameters: ["n", "list"],
      body: If(
        Compare("==", Name("n"), Number(0)),
        Void,
        Tuple(
          Accessor(Name("list"), Number(0)),
          Call(
            Name("take"),
            Arithmetic("-", Name("n"), Number(1)),
            Accessor(Name("list"), Number(1))
          )
        )
      )
    }),
    Main({
      body: Procedure(
        ForIn({
          binding: "i",
          value: Call(Name("take"), Number(10), Name("recList")),
          body: Print({
            value: Name("i")
          })
        })
      )
    })
  ]
};
