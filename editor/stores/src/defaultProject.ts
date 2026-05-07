import { decl, expr, module, node, stmt } from "./parserFactories";

import type { Module } from "@serendipity/parser";

export const defaultProject: Module = module([
  decl.const("recList", expr.tuple([expr.number("1"), expr.name("recList")])),
  decl.function(
    "take",
    [{ name: node("n") }, { name: node("list") }],
    expr.if(
      expr.compare({ kind: "Equal" }, expr.name("n"), expr.number("0")),
      expr.none(),
      expr.tuple([
        expr.accessor(expr.name("list"), expr.number("0")),
        expr.call(expr.name("take"), [
          expr.arithmetic({ kind: "Subtract" }, expr.name("n"), expr.number("1")),
          expr.accessor(expr.name("list"), expr.number("1")),
        ]),
      ])
    )
  ),
  decl.main(
    expr.procedure([
      stmt.forIn(
        "i",
        expr.call(expr.name("take"), [expr.number("10"), expr.name("recList")]),
        stmt.expression(expr.call(expr.fieldAccess(expr.name("__core"), "print_stmt"), [expr.name("i")]))
      ),
    ])
  ),
]);
