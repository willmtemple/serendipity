// Formatter - Formats the code in the given files
// Usage: format <file>...

import fs from "node:fs/promises";

import {
  parse,
  ParseNode,
  Module,
  Declaration,
  Expression,
  Type,
  GenericParameter,
  ParameterDeclaration,
  RecordElement,
  BindingPattern,
  RecordBindingElement,
  UnaryOp,
  Statement,
  InterfaceField,
  Assignment,
  ArithmeticOp,
  CompareOp,
  Range,
} from "@serendipity/parser";
import {
  FormatAlternative,
  formatFile,
  FormatSequence,
  FormatSpan,
  FormatUnit,
  ReflowOptions,
} from "@serendipity/formatter";
import { match } from "omnimatch";
import { TextDecoder } from "node:util";

function slice(data: Uint8Array, range: Range): string {
  return new TextDecoder().decode(data.slice(range[0].absolute, range[1].absolute));
}

interface FormatContext {
  data: Uint8Array;
}

function toFormatBody(ctx: FormatContext, module: ParseNode<Module>): FormatUnit[] {
  const result: FormatUnit[] = [];

  for (const declaration of module.value.declarations) {
    result.push(formatDeclaration(ctx, declaration));
    // result.push(empty);
  }

  return result;
}

const empty = FormatUnit.Span("");

const semicolon = FormatUnit.Span(";");

const colon = FormatUnit.Span(":");

const space = FormatUnit.Span(" ");

// const comma = FormatUnit.Span(",");

const commaSpace = FormatUnit.Span(", ");

const pipe = FormatUnit.Span("|");

const dot = FormatUnit.Span(".");

const dotDotDot = FormatUnit.Span("...");

function formatDeclaration(ctx: FormatContext, declaration: ParseNode<Declaration>): FormatUnit {
  return addDeclarationComments(
    ctx,
    declaration,
    match(declaration.value, {
      Const: ({ constKeyword, identifier, equalsToken, type, value }) =>
        FormatUnit.Sequence(
          formatVerbatim(constKeyword),
          space,
          formatVerbatim(identifier),
          ...(type === undefined ? [] : [colon, space, formatType(type.value.type)]),
          space,
          formatVerbatim(equalsToken),
          space,
          formatExpression(value),
          semicolon
        ),
      Function: ({
        arrowToken,
        body,
        functionKeyword,
        identifier,
        parameters,
        constraint,
        genericParameters,
      }): FormatUnit =>
        FormatUnit.Sequence(
          formatVerbatim(functionKeyword),
          space,
          formatVerbatim(identifier),
          ...(genericParameters === undefined
            ? []
            : [formatBalancedList(genericParameters, ["[", "]"], formatTypeParameter, commaSpace)]),
          formatBalancedList(parameters, ["(", ")"], formatParameter, commaSpace),
          ...(constraint === undefined ? [] : [colon, space, formatType(constraint.value.type)]),
          space,
          formatVerbatim(arrowToken),
          space,
          optionallyParenthesizeBlock(formatExpression(body)),
          semicolon
        ),
      Main: ({ mainKeyword, body }) =>
        FormatUnit.Sequence(formatVerbatim(mainKeyword), space, formatExpression(body)),
      Export: ({ exportKeyword, elements }) =>
        FormatUnit.Sequence(
          formatVerbatim(exportKeyword),
          space,
          formatBalancedList(elements, ["{", "}"], formatRecordElement, commaSpace, space)
        ),
      Import: ({ importKeyword, pattern, equalToken, useKeyword, moduleSpecifier }) =>
        FormatUnit.Sequence(
          formatVerbatim(importKeyword),
          space,
          formatPattern(pattern),
          space,
          formatVerbatim(equalToken),
          space,
          formatVerbatim(useKeyword),
          FormatUnit.Span("("),
          formatStringLiteral(moduleSpecifier.value),
          FormatUnit.Span(")")
        ),
      Interface: ({ interfaceKeyword, name, genericParameters, constraint, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(interfaceKeyword),
          space,
          formatVerbatim(name),
          ...(genericParameters === undefined
            ? []
            : [formatBalancedList(genericParameters, ["[", "]"], formatTypeParameter, commaSpace)]),
          ...(constraint === undefined ? [] : [colon, space, formatType(constraint.value.type)]),
          space,
          FormatUnit.Block(
            ["{", "}"],
            ...body.value.map((f) => FormatUnit.Sequence(formatInterfaceField(f), semicolon))
          )
        ),
      TypeAlias: ({ typeKeyword, name, genericParameters, equalsToken, value }) =>
        FormatUnit.Sequence(
          formatVerbatim(typeKeyword),
          space,
          formatVerbatim(name),
          ...(genericParameters === undefined
            ? []
            : [formatBalancedList(genericParameters, ["[", "]"], formatTypeParameter, commaSpace)]),
          space,
          formatVerbatim(equalsToken),
          space,
          formatType(value),
          semicolon
        ),
    }) ?? { kind: "span", span: `<${declaration.value.kind}>` }
  );
}

function addDeclarationComments(
  ctx: FormatContext,
  declaration: ParseNode<Declaration>,
  unit: FormatUnit
): FormatUnit {
  const { commentRanges } = declaration;

  if (commentRanges && commentRanges.length > 0) {
    return FormatUnit.Body([
      ...spitCommentBody(ctx, commentRanges, declaration.range[0].line),
      unit,
    ]);
  } else {
    return unit;
  }
}

/**
 * Writes a sequence of comments. This preserves only one blank line between comments as well as between the last
 * comment and the next syntax line.
 *
 * @param ctx - The format context
 * @param ranges - The ranges of the comments to write
 * @param nextSyntaxLine - The line number of the next syntax line
 * @returns An iterable of format units
 */
function* spitCommentBody(
  ctx: FormatContext,
  ranges: Range[],
  nextSyntaxLine: number
): Iterable<FormatUnit> {
  if (ranges.length === 0) return;

  let currentEndLine = ranges[0][1].line;

  yield FormatUnit.Span(slice(ctx.data, ranges[0]));

  for (const [start, end] of ranges.slice(1)) {
    if (start.line > currentEndLine + 1) {
      yield FormatUnit.Span("");
    }

    yield FormatUnit.Span(slice(ctx.data, [start, end]));

    currentEndLine = end.line;
  }

  if (currentEndLine < nextSyntaxLine - 1) {
    yield FormatUnit.Span("");
  }
}

function formatInterfaceField(node: ParseNode<InterfaceField>): FormatUnit {
  const { name, constraint } = node.value;
  return FormatUnit.Sequence(formatVerbatim(name), colon, space, formatType(constraint.value.type));
}

function formatStringLiteral(s: string): FormatUnit {
  // fuck it, just use JSON.stringify
  return FormatUnit.Span(JSON.stringify(s));
}

function formatPattern(node: ParseNode<BindingPattern>): FormatUnit {
  return match(node.value, {
    Identifier: ({ name }) => formatVerbatim(name),
    Tuple: ({ patterns }) => formatBalancedList(patterns, ["(", ")"], formatPattern, commaSpace),
    Record: ({ elements }) =>
      formatBalancedList(elements, ["{", "}"], formatRecordBindingElement, commaSpace, space),
  });
}

function formatRecordBindingElement(node: ParseNode<RecordBindingElement>): FormatUnit {
  return match(node.value, {
    Identifier: ({ name }) => formatVerbatim(name),
    Rest: ({ name }) => FormatUnit.Sequence(dotDotDot, formatVerbatim(name)),
    KeyValuePair: ({ name, pattern }) =>
      FormatUnit.Sequence(formatVerbatim(name), colon, space, formatPattern(pattern)),
  });
}

function formatRecordElement(node: ParseNode<RecordElement>): FormatUnit {
  return match(node.value, {
    Identifier: ({ name }) => formatVerbatim(name),
    Spread: ({ value }) => FormatUnit.Sequence(dotDotDot, formatExpression(value)),
    KeyValuePair: ({ key, value }) =>
      FormatUnit.Sequence(formatVerbatim(key), colon, space, formatExpression(value)),
  });
}

function formatTypeParameter(node: ParseNode<GenericParameter>): FormatSequence {
  const { name, constraint } = node.value;
  return FormatUnit.Sequence(
    formatVerbatim(name),
    ...(constraint === undefined ? [] : [colon, space, formatType(constraint.value.type)])
  );
}

function formatParameter(node: ParseNode<ParameterDeclaration>): FormatSequence {
  const { name, type } = node.value;
  return {
    kind: "sequence",
    contents: [
      formatVerbatim(name),
      ...(type === undefined ? [] : [colon, space, formatType(type.value.type)]),
    ],
  };
}

function formatExpression(node: ParseNode<Expression>): FormatUnit {
  return (
    match(node.value, {
      None: () => FormatUnit.Span("none"),
      Name: (n) => FormatUnit.Span(n[0]),
      String: (s) => formatStringLiteral(s[0]),
      Number: (n) => FormatUnit.Span(n[0]),
      Hole: () => dotDotDot,
      Tuple: ({ elements }) =>
        formatBalancedList(elements, ["(", ")"], formatExpression, commaSpace),
      Record: ({ elements }) =>
        formatBalancedList(elements, ["{", "}"], formatRecordElement, commaSpace),
      Boolean: (b) => FormatUnit.Span(b[0] ? "true" : "false"),
      Unary: ({ operator, expression }) =>
        FormatUnit.Sequence(formatOperator(operator), formatExpression(expression)),
      Accessor: ({ accessee, index }) =>
        FormatUnit.Sequence(
          formatExpression(accessee),
          FormatUnit.Span("["),
          formatExpression(index),
          FormatUnit.Span("]")
        ),
      Call: ({ callee, parameters }) =>
        FormatUnit.Sequence(
          formatExpression(callee),
          formatBalancedList(parameters, ["(", ")"], formatExpression, commaSpace)
        ),
      Procedure: ({ body }) =>
        FormatUnit.Block(
          ["#[", "]"],
          ...body.value.map((s) => FormatUnit.Sequence(formatStatement(s), semicolon))
        ),
      List: ({ elements }) =>
        formatBalancedList(elements, ["[", "]"], formatExpression, commaSpace),
      As: ({ expr, asToken, type }) =>
        FormatUnit.Sequence(
          formatExpression(expr),
          space,
          formatVerbatim(asToken),
          space,
          formatType(type)
        ),
      Function: ({
        fnKeyword,
        name,
        genericParameters,
        parameters,
        constraint,
        arrowToken,
        body,
      }) =>
        FormatUnit.Sequence(
          formatVerbatim(fnKeyword),
          space,
          name && formatVerbatim(name),
          genericParameters === undefined
            ? empty
            : formatBalancedList(genericParameters, ["[", "]"], formatTypeParameter, commaSpace),
          formatBalancedList(parameters, ["(", ")"], formatParameter, commaSpace),
          constraint === undefined
            ? empty
            : FormatUnit.Sequence(colon, space, formatType(constraint.value.type)),
          space,
          formatVerbatim(arrowToken),
          space,
          optionallyParenthesizeBlock(formatExpression(body))
        ),
      With: ({ withKeyword, bindings, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(withKeyword),
          space,
          formatBalancedList(bindings, ["(", ")"], formatAssignment, commaSpace),
          space,
          formatExpression(body)
        ),
      FieldAccess: ({ accessee, field }) =>
        FormatUnit.Sequence(formatExpression(accessee), dot, formatVerbatim(field)),
      Arithmetic: ({ left, operator, right }) =>
        FormatUnit.Sequence(
          formatExpression(left),
          space,
          formatOperator(operator),
          space,
          formatExpression(right)
        ),
      Compare: ({ left, operator, right }) =>
        FormatUnit.Sequence(
          formatExpression(left),
          space,
          formatOperator(operator),
          space,
          formatExpression(right)
        ),
      If: ({ ifKeyword, condition, thenKeyword, then, elseKeyword, Else }) =>
        FormatUnit.Sequence(
          formatVerbatim(ifKeyword),
          space,
          optionallyParenthesizeBlock(formatExpression(condition)),
          space,
          formatVerbatim(thenKeyword),
          space,
          optionallyParenthesizeBlock(formatExpression(then)),
          space,
          formatVerbatim(elseKeyword),
          space,
          optionallyParenthesizeBlock(formatExpression(Else))
        ),
    }) ?? { kind: "span", span: "<not implemented>" }
  );
}

function formatOperator(node: ParseNode<UnaryOp | ArithmeticOp | CompareOp>): FormatSpan {
  return match(node.value, {
    Minus: () => FormatUnit.Span("-"),
    Negate: () => FormatUnit.Span("!"),
    Add: () => FormatUnit.Span("+"),
    Multiply: () => FormatUnit.Span("*"),
    Divide: () => FormatUnit.Span("/"),
    Equal: () => FormatUnit.Span("=="),
    NotEqual: () => FormatUnit.Span("!="),
    LessThan: () => FormatUnit.Span("<"),
    LessThanOrEqual: () => FormatUnit.Span("<="),
    GreaterThan: () => FormatUnit.Span(">"),
    GreaterThanOrEqual: () => FormatUnit.Span(">="),
    Modulus: () => FormatUnit.Span("%"),
    Subtract: () => FormatUnit.Span("-"),
  });
}

function formatStatement(node: ParseNode<Statement>): FormatUnit {
  return (
    match(node.value, {
      Break: () => FormatUnit.Span("break"),
      Continue: () => FormatUnit.Span("continue"),
      Do: (d) => FormatUnit.Sequence(FormatUnit.Span("do"), space, formatExpression(d[0])),
      Expression: (e) => formatExpression(e[0]),
      If: ({ ifKeyword, condition, thenKeyword, then, Else }) =>
        FormatUnit.Sequence(
          formatVerbatim(ifKeyword),
          space,
          formatExpression(condition),
          space,
          formatVerbatim(thenKeyword),
          space,
          formatStatement(then),
          ...(Else === undefined
            ? []
            : [
                space,
                formatVerbatim(Else.value.elseKeyword),
                space,
                formatStatement(Else.value.body),
              ])
        ),
      Forever: (f) => FormatUnit.Sequence(FormatUnit.Span("loop"), space, formatStatement(f[0])),
      ForIn: ({ forKeyword, binding, inKeyword, iterator, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(forKeyword),
          space,
          formatVerbatim(binding),
          space,
          formatVerbatim(inKeyword),
          space,
          formatExpression(iterator),
          space,
          formatStatement(body)
        ),
      Pass: () => FormatUnit.Span("pass"),
      Let: ({ letKeyword, assignment }) =>
        FormatUnit.Sequence(formatVerbatim(letKeyword), space, formatAssignment(assignment)),
      Set: ([assignment]) => formatAssignment(assignment),
    }) ?? FormatUnit.Span("<not implemented>")
  );
}

function formatAssignment(node: ParseNode<Assignment>): FormatUnit {
  return FormatUnit.Sequence(
    formatVerbatim(node.value.symbol),
    space,
    FormatUnit.Span("="),
    space,
    formatExpression(node.value.value)
  );
}

function formatBalancedList<T>(
  node: ParseNode<Array<ParseNode<T>>>,
  delimiters: [string, string],
  formatter: (node: ParseNode<T>) => FormatUnit,
  separator: FormatSpan | null,
  cushion?: FormatSpan | null
): FormatUnit {
  const options: ReflowOptions = {};

  if (separator !== null) {
    options.trimPostfix = separator.span;
  }

  if (cushion !== null && cushion !== undefined) {
    options.cushion = cushion.span;
  }

  return FormatUnit.Reflow(
    delimiters,
    node.value.map(
      (element): FormatSequence => ({
        kind: "sequence",
        contents: [formatter(element), ...(separator === null ? [] : [separator])],
      })
    ),
    options
  );
}

function optionallyParenthesizeBlock(unit: FormatUnit): FormatAlternative {
  return {
    kind: "alternative",
    preferred: unit,
    alternative: FormatUnit.Block(["(", ")"], unit),
  };
}

function formatType(node: ParseNode<Type>): FormatUnit {
  return (
    match(node.value, {
      Never: (): FormatSpan => ({
        kind: "span",
        span: "!",
      }),
      Unknown: (): FormatSpan => ({
        kind: "span",
        span: "_",
      }),
      Kind: (): FormatSpan => ({
        kind: "span",
        span: "*",
      }),
      Tuple: ({ members }) => formatBalancedList(members, ["(", ")"], formatType, commaSpace),
      Union: ({ left, right }): FormatSequence => ({
        kind: "sequence",
        contents: [formatType(left), space, pipe, space, formatType(right)],
      }),
      Reference: ({ name, genericParameters }): FormatSequence => ({
        kind: "sequence",
        contents: [
          formatVerbatim(name),
          ...(genericParameters
            ? [formatBalancedList(genericParameters, ["[", "]"], formatType, commaSpace)]
            : []),
        ],
      }),
      Function: ({ fnKeyword, parameters, arrowToken, returnType }): FormatSequence => ({
        kind: "sequence",
        contents: [
          formatVerbatim(fnKeyword),
          formatBalancedList(parameters, ["(", ")"], formatType, commaSpace),
          space,
          formatVerbatim(arrowToken),
          space,
          optionallyParenthesizeBlock(formatType(returnType)),
        ],
      }),
    }) ?? { kind: "span", span: "<not implemented>" }
  );
}

function formatVerbatim(node: ParseNode<string>): FormatSpan {
  return FormatUnit.Span(node.value);
}

async function main() {
  const [file] = process.argv.slice(2);

  if (!file) {
    throw new Error("No file specified");
  }

  const fileData = await fs.readFile(file);
  const parsed = parse(fileData);

  if (parsed.error || parsed.result === undefined) {
    for (const diagnostic of parsed.diagnostics) {
      const loc = Array.isArray(diagnostic.location) ? diagnostic.location[0] : diagnostic.location;
      console.log(
        file + ":" + (loc ? `${loc.line + 1}:${loc.column + 1}` : "<unk>"),
        "-",
        diagnostic.message
      );
    }
    process.exit(1);
  }

  const ctx: FormatContext = {
    data: fileData,
  };

  const formatted = formatFile(toFormatBody(ctx, parsed.result), {
    indent: "  ",
    maxLineLength: 80,
  });

  console.log(formatted);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
