// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { expression } from "@serendipity/syntax-abstract";
import { matchExpression } from "@serendipity/syntax-abstract/dist/expression";

export function writeAbstract(s: expression.Expression): string {
  return matchExpression({
    Accessor: ({ accessee, index }) => `${writeAbstract(accessee)}[${writeAbstract(index)}]`,
    BinaryOp: ({ left, op, right }) => `(${op} ${writeAbstract(left)} ${writeAbstract(right)})`,
    Boolean: ({ value }) => value.toString(),
    Number: ({ value }) => value.toString(),
    String: ({ value }) => '"' + value.toString() + '"',
    Call: ({ callee, parameter }) =>
      `(${writeAbstract(callee)}${parameter ? " " + writeAbstract(parameter) : ""})`,
    Name: ({ name }) => name.trimLeft(),
    Tuple: ({ values }) => "(cons " + values.map(writeAbstract).join(" ") + ")",
    Void: (_) => "void",
    If: ({ cond, then, _else }) =>
      `(if ${writeAbstract(cond)} ${writeAbstract(then)} ${writeAbstract(_else)})`,
    Closure: ({ body, parameter }) => `λ${parameter.trimLeft() || ""}.${writeAbstract(body)}`
  })(s);
}
