// Copyright (c) William Temple
// Licensed under the MIT license.

import {
  Expression,
  Global,
  Module,
  Statement,
} from "@serendipity/syntax-surface";

import { match } from "omnimatch";

const INDENT_SPACES = 2;

const MAX_LINE_LENGTH = 120;

function makeIndent(indent: number) {
  return " ".repeat(indent * INDENT_SPACES);
}

function formatList(items: string[], sep: string, indent: number = 0) {
  const length =
    items.reduce((accum, item) => item.length + accum, 0) +
    (items.length - 1) * (sep.length + 1) +
    indent * INDENT_SPACES;

  return length > MAX_LINE_LENGTH
    ? items.join(`${sep}\n` + makeIndent(indent))
    : items.join(`${sep} `);
}

function printStatement(statement: Statement): string {
  const x = printExpression;
  return match(statement, {
    Break: () => "break",
    Do: ({ body }) => `do ${x(body)}`,
    ForIn: ({ binding, value, body }) =>
      `for ${binding} in ${x(value)} (${printStatement(body)})`,
    Forever: ({ body }) => "",
    If: ({ condition, body, _else }) => {
      let out = `if ${x(condition)} (${printStatement(body)})`;
      if (_else !== undefined) {
        out += ` else (${printStatement(_else)})`;
      }

      return out;
    },
    Let: ({ name, value }) => `let ${name} = ${x(value)}`,
    Print: ({ value }) => `print ${x(value)}`,
    Set: ({ name, value }) => `set! ${name} = ${x(value)}`,
    "@hole": () => "...",
  });
}

function printExpression(expression: Expression): string {
  const x = printExpression;
  return match(expression, {
    Arithmetic: ({ left, op, right }) => `${x(left)} ${op} ${x(right)}`,
    Accessor: ({ accessee, index }) => `${x(accessee)}[${x(index)}]`,
    Boolean: ({ value }) => (value ? "true" : "false"),
    Call: ({ callee, parameters }) =>
      `${x(callee)}(${formatList(parameters.map(x), ",")})`,
    Closure: ({ parameters, body }) =>
      `fn (${formatList(parameters, ",")}) -> ${x(body)}`,
    Compare: ({ left, op, right }) => `${x(left)} ${op} ${x(right)}`,
    If: ({ cond, then, _else }) =>
      `if ${x(cond)} then ${x(then)} else ${x(_else)}`,
    List: ({ contents }) => `[${formatList(contents.map(x), ",")}]`,
    Name: ({ name }) => name,
    Number: ({ value }) => value.toString(),
    Record: ({ data }) =>
      `{${Object.entries(data)
        .map(([k, v]) => `${k}: ${printExpression(v)}`)
        .join(", ")}}`,
    Procedure: ({ body }) => `#[${formatList(body.map(printStatement), ";")}]`,
    String: ({ value }) => `"${value}"`,
    Tuple: ({ values }) => `(${formatList(values.map(x), ",")})`,
    Void: () => "empty",
    With: ({ binding, expr }) =>
      `with (${binding[0]} = ${x(binding[1])}) ${x(expr)}`,
    "@hole": () => "...",
  });
}

function printGlobal(global: Global): string {
  return match(global, {
    Define: ({ name, value }) => `let ${name} = ${printExpression(value)};`,
    DefineFunction: ({ name, parameters, body }) =>
      `fn ${name}(${formatList(parameters, ",")}) => ${printExpression(body)};`,
    Main: ({ body }) => `on start ${printExpression(body)};`,
  });
}

export function printModule(module: Module): string {
  return module.globals.map(printGlobal).join("\n\n");
}
