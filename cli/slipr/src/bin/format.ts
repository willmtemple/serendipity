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
  LogicalOp,
  IfStatement,
  ElseClause,
  StringExpression,
} from "@serendipity/parser";
import {
  FormatAlternative,
  FormatSequence,
  FormatSpan,
  FormatUnit,
  ReflowOptions,
  writeFile,
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
    result.push(empty);
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
  dodgeCommentRanges(ctx.data, ...(declaration.commentRanges ?? []));
  return addDeclarationComments(
    ctx,
    declaration,
    match(declaration.value, {
      Const: ({ constKeyword, identifier, equalsToken, type, value }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, constKeyword),
          space,
          formatVerbatim(ctx, identifier),
          ...(type === undefined ? [] : [colon, space, formatType(ctx, type.value.type)]),
          space,
          formatVerbatim(ctx, equalsToken),
          space,
          formatExpression(ctx, value),
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
          formatVerbatim(ctx, functionKeyword),
          space,
          formatVerbatim(ctx, identifier),
          ...(genericParameters === undefined
            ? []
            : [
                formatBalancedList(
                  ctx,
                  genericParameters,
                  ["[", "]"],
                  formatTypeParameter,
                  commaSpace
                ),
              ]),
          formatBalancedList(ctx, parameters, ["(", ")"], formatParameter, commaSpace),
          ...(constraint === undefined
            ? []
            : [colon, space, formatType(ctx, constraint.value.type)]),
          space,
          formatVerbatim(ctx, arrowToken),
          space,
          optionallyParenthesizeBlock(formatExpression(ctx, body)),
          semicolon
        ),
      Main: ({ mainKeyword, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, mainKeyword),
          space,
          formatExpression(ctx, body),
          semicolon
        ),
      Export: ({ exportKeyword, elements }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, exportKeyword),
          space,
          formatBalancedList(ctx, elements, ["{", "}"], formatRecordElement, commaSpace, space)
        ),
      Import: ({ importKeyword, pattern, equalToken, useKeyword, moduleSpecifier }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, importKeyword),
          space,
          formatPattern(ctx, pattern),
          space,
          formatVerbatim(ctx, equalToken),
          space,
          formatVerbatim(ctx, useKeyword),
          FormatUnit.Span("("),
          formatStringLiteral(ctx, moduleSpecifier),
          FormatUnit.Span(")"),
          semicolon
        ),
      Interface: ({ interfaceKeyword, name, genericParameters, constraint, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, interfaceKeyword),
          space,
          formatVerbatim(ctx, name),
          ...(genericParameters === undefined
            ? []
            : [
                formatBalancedList(
                  ctx,
                  genericParameters,
                  ["[", "]"],
                  formatTypeParameter,
                  commaSpace
                ),
              ]),
          ...(constraint === undefined
            ? []
            : [colon, space, formatType(ctx, constraint.value.type)]),
          space,
          FormatUnit.Block(
            ["{", "}"],
            ...body.value.map((f) => FormatUnit.Sequence(formatInterfaceField(ctx, f), semicolon))
          )
        ),
      TypeAlias: ({ typeKeyword, name, genericParameters, equalsToken, value }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, typeKeyword),
          space,
          formatVerbatim(ctx, name),
          ...(genericParameters === undefined
            ? []
            : [
                formatBalancedList(
                  ctx,
                  genericParameters,
                  ["[", "]"],
                  formatTypeParameter,
                  commaSpace
                ),
              ]),
          space,
          formatVerbatim(ctx, equalsToken),
          space,
          formatType(ctx, value),
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

  uncolorCommentRanges(ctx.data, ...(commentRanges ?? []));

  if (commentRanges && commentRanges.length > 0) {
    return FormatUnit.Body(...spitCommentBody(ctx, commentRanges, declaration.range[0].line), unit);
  } else {
    return unit;
  }
}

function addStatementComments(
  ctx: FormatContext,
  statement: ParseNode<Statement>,
  unit: FormatUnit
): FormatUnit {
  const { commentRanges } = statement;

  uncolorCommentRanges(ctx.data, ...(commentRanges ?? []));

  if (commentRanges && commentRanges.length > 0) {
    return FormatUnit.Body(...spitCommentBody(ctx, commentRanges, statement.range[0].line), unit);
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

  for (const range of ranges.slice(1)) {
    const [start, end] = range;
    if (start.line > currentEndLine + 1) {
      yield FormatUnit.Span("");
    }

    yield FormatUnit.Span(slice(ctx.data, range));

    currentEndLine = end.line;
  }

  if (currentEndLine < nextSyntaxLine - 1) {
    yield FormatUnit.Span("");
  }
}

function formatInterfaceField(ctx: FormatContext, node: ParseNode<InterfaceField>): FormatUnit {
  const { name, constraint } = node.value;
  return FormatUnit.Sequence(
    formatVerbatim(ctx, name),
    colon,
    space,
    formatType(ctx, constraint.value.type)
  );
}

function formatStringLiteral(
  ctx: FormatContext,
  s: ParseNode<string | StringExpression>
): FormatUnit {
  // Slice the original string from the file's source. This might have some weird newlines or other stuff in it, but it's
  // the _exact same_ text that the user typed into the string.
  // TODO: is this good enough? Should we try to normalize the string?
  return FormatUnit.Span(slice(ctx.data, s.range));
}

function formatPattern(ctx: FormatContext, node: ParseNode<BindingPattern>): FormatUnit {
  return match(node.value, {
    Identifier: ({ name }) => formatVerbatim(ctx, name),
    Tuple: ({ patterns }) =>
      formatBalancedList(ctx, patterns, ["(", ")"], formatPattern, commaSpace),
    Record: ({ elements }) =>
      formatBalancedList(ctx, elements, ["{", "}"], formatRecordBindingElement, commaSpace, space),
  });
}

function formatRecordBindingElement(
  ctx: FormatContext,
  node: ParseNode<RecordBindingElement>
): FormatUnit {
  return match(node.value, {
    Identifier: ({ name }) => formatVerbatim(ctx, name),
    Rest: ({ name }) => FormatUnit.Sequence(dotDotDot, formatVerbatim(ctx, name)),
    KeyValuePair: ({ name, pattern }) =>
      FormatUnit.Sequence(formatVerbatim(ctx, name), colon, space, formatPattern(ctx, pattern)),
  });
}

function formatRecordElement(ctx: FormatContext, node: ParseNode<RecordElement>): FormatUnit {
  return match(node.value, {
    Identifier: ({ name }) => formatVerbatim(ctx, name),
    Spread: ({ value }) => FormatUnit.Sequence(dotDotDot, formatExpression(ctx, value)),
    KeyValuePair: ({ key, value }) =>
      FormatUnit.Sequence(formatVerbatim(ctx, key), colon, space, formatExpression(ctx, value)),
  });
}

function formatTypeParameter(
  ctx: FormatContext,
  node: ParseNode<GenericParameter>
): FormatSequence {
  const { name, constraint } = node.value;
  return FormatUnit.Sequence(
    formatVerbatim(ctx, name),
    ...(constraint === undefined ? [] : [colon, space, formatType(ctx, constraint.value.type)])
  );
}

function formatParameter(
  ctx: FormatContext,
  node: ParseNode<ParameterDeclaration>
): FormatSequence {
  const { name, type } = node.value;
  return {
    kind: "sequence",
    contents: [
      formatVerbatim(ctx, name),
      ...(type === undefined ? [] : [colon, space, formatType(ctx, type.value.type)]),
    ],
  };
}

function formatExpression(ctx: FormatContext, node: ParseNode<Expression>): FormatUnit {
  return (
    match(node.value, {
      None: () => FormatUnit.Span("none"),
      Name: (n) => FormatUnit.Span(n[0]),
      String: () => formatStringLiteral(ctx, node as ParseNode<StringExpression>),
      Number: (n) => FormatUnit.Span(n[0]),
      Hole: () => dotDotDot,
      Tuple: ({ elements }) =>
        formatBalancedList(ctx, elements, ["(", ")"], formatExpression, commaSpace),
      Record: ({ elements }) =>
        formatBalancedList(ctx, elements, ["{", "}"], formatRecordElement, commaSpace),
      Boolean: (b) => FormatUnit.Span(b[0] ? "true" : "false"),
      Unary: ({ operator, expression }) =>
        FormatUnit.Sequence(formatOperator(operator), formatExpression(ctx, expression)),
      Accessor: ({ accessee, index }) =>
        FormatUnit.Sequence(
          formatExpression(ctx, accessee),
          FormatUnit.Span("["),
          formatExpression(ctx, index),
          FormatUnit.Span("]")
        ),
      Call: ({ callee, parameters }) =>
        FormatUnit.Sequence(
          formatExpression(ctx, callee),
          formatBalancedList(ctx, parameters, ["(", ")"], formatExpression, commaSpace)
        ),
      Procedure: ({ body }) =>
        FormatUnit.Block(
          ["#[", "]"],
          ...body.value.map((s) => FormatUnit.Sequence(formatStatement(ctx, s, semicolon)))
        ),
      List: ({ elements }) =>
        formatBalancedList(ctx, elements, ["[", "]"], formatExpression, commaSpace),
      As: ({ expr, asToken, type }) =>
        FormatUnit.Sequence(
          formatExpression(ctx, expr),
          space,
          formatVerbatim(ctx, asToken),
          space,
          formatType(ctx, type)
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
          formatVerbatim(ctx, fnKeyword),
          space,
          name && formatVerbatim(ctx, name),
          genericParameters === undefined
            ? empty
            : formatBalancedList(
                ctx,
                genericParameters,
                ["[", "]"],
                formatTypeParameter,
                commaSpace
              ),
          formatBalancedList(ctx, parameters, ["(", ")"], formatParameter, commaSpace),
          constraint === undefined
            ? empty
            : FormatUnit.Sequence(colon, space, formatType(ctx, constraint.value.type)),
          space,
          formatVerbatim(ctx, arrowToken),
          space,
          optionallyParenthesizeBlock(formatExpression(ctx, body))
        ),
      With: ({ withKeyword, bindings, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, withKeyword),
          space,
          formatBalancedList(ctx, bindings, ["(", ")"], formatAssignment, commaSpace),
          space,
          formatExpression(ctx, body)
        ),
      FieldAccess: ({ accessee, field }) =>
        FormatUnit.Sequence(formatExpression(ctx, accessee), dot, formatVerbatim(ctx, field)),
      Arithmetic: ({ left, operator, right }) =>
        FormatUnit.Sequence(
          formatExpression(ctx, left),
          space,
          formatOperator(operator),
          space,
          formatExpression(ctx, right)
        ),
      Logical: ({ left, operator, right }) =>
        FormatUnit.Sequence(
          formatExpression(ctx, left),
          space,
          formatOperator(operator),
          space,
          formatExpression(ctx, right)
        ),
      Compare: ({ left, operator, right }) =>
        FormatUnit.Sequence(
          formatExpression(ctx, left),
          space,
          formatOperator(operator),
          space,
          formatExpression(ctx, right)
        ),
      If: ({ ifKeyword, condition, thenKeyword, then, elseKeyword, Else }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, ifKeyword),
          space,
          optionallyParenthesizeBlock(formatExpression(ctx, condition)),
          space,
          formatVerbatim(ctx, thenKeyword),
          space,
          optionallyParenthesizeBlock(formatExpression(ctx, then)),
          space,
          formatVerbatim(ctx, elseKeyword),
          space,
          optionallyParenthesizeBlock(formatExpression(ctx, Else))
        ),
    }) ?? unimplemented(node.value.kind)
  );
}

function formatOperator(
  node: ParseNode<UnaryOp | ArithmeticOp | CompareOp | LogicalOp>
): FormatSpan {
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
    And: () => FormatUnit.Span("&&"),
    Or: () => FormatUnit.Span("||"),
  });
}

function formatStatement(
  ctx: FormatContext,
  node: ParseNode<Statement>,
  end: FormatSpan
): FormatUnit {
  dodgeCommentRanges(ctx.data, ...(node.commentRanges ?? []));
  return addStatementComments(
    ctx,
    node,
    match(node.value, {
      Break: () => FormatUnit.Sequence(FormatUnit.Span("break"), end),
      Continue: () => FormatUnit.Sequence(FormatUnit.Span("continue"), end),
      Do: (d) =>
        FormatUnit.Sequence(FormatUnit.Span("do"), space, formatExpression(ctx, d[0]), end),
      Pass: () => FormatUnit.Sequence(FormatUnit.Span("pass"), end),
      Expression: (e) => FormatUnit.Sequence(formatExpression(ctx, e[0]), end),
      If: () => formatIfStatement(ctx, node as ParseNode<IfStatement>),
      Forever: (f) =>
        FormatUnit.Sequence(
          FormatUnit.Span("loop"),
          space,
          optionallyBlockStatement(ctx, f[0], end),
          semicolon
        ),
      ForIn: ({ forKeyword, binding, inKeyword, iterator, body }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, forKeyword),
          space,
          formatVerbatim(ctx, binding),
          space,
          formatVerbatim(ctx, inKeyword),
          space,
          formatExpression(ctx, iterator),
          space,
          optionallyBlockStatement(ctx, body, semicolon)
        ),
      Let: ({ letKeyword, assignment }) =>
        FormatUnit.Sequence(
          formatVerbatim(ctx, letKeyword),
          space,
          formatAssignment(ctx, assignment),
          semicolon
        ),
      Set: ([assignment]) => formatAssignment(ctx, assignment),
    }) ?? unimplemented(node.value.kind)
  );
}

function formatIfStatement(ctx: FormatContext, node: ParseNode<IfStatement>): FormatUnit {
  const { ifKeyword, condition, thenKeyword, then, Else } = node.value;

  const base = FormatUnit.Sequence(
    formatVerbatim(ctx, ifKeyword),
    space,
    optionallyParenthesizeBlock(formatExpression(ctx, condition)),
    space,
    formatVerbatim(ctx, thenKeyword),
    space,
    optionallyBlockStatement(ctx, then, empty),
    ...(Else === undefined
      ? []
      : [
          space,
          formatVerbatim(ctx, Else.value.elseKeyword),
          space,
          formatStatement(ctx, Else.value.body, empty),
        ]),
    semicolon
  );

  return FormatUnit.Alternative(base, () =>
    FormatUnit.Body(
      FormatUnit.Sequence(
        formatVerbatim(ctx, ifKeyword),
        space,
        formatExpression(ctx, condition),
        space,
        formatVerbatim(ctx, thenKeyword),
        space,
        optionallyBlockStatement(ctx, then, empty),
        ...(Else === undefined ? [semicolon] : [])
      ),
      ...formatElseIfChain(ctx, Else)
    )
  );
}

function formatElseIfChain(
  ctx: FormatContext,
  node: ParseNode<ElseClause> | undefined
): FormatUnit[] {
  if (!node) return [];

  let { elseKeyword: elseCursor, body: bodyCursor } = node.value;
  const result: FormatUnit[] = [];
  // This is an else-if chain
  while (bodyCursor.value.kind === "If") {
    const { ifKeyword, condition, thenKeyword, then } = bodyCursor.value;
    result.push(
      FormatUnit.Sequence(
        formatVerbatim(ctx, elseCursor),
        space,
        formatVerbatim(ctx, ifKeyword),
        space,
        optionallyParenthesizeBlock(formatExpression(ctx, condition)),
        space,
        formatVerbatim(ctx, thenKeyword),
        space,
        optionallyBlockStatement(ctx, then, empty),
        ...(bodyCursor.value.Else === undefined ? [semicolon] : [])
      )
    );

    if (bodyCursor.value.Else === undefined) return result;

    elseCursor = bodyCursor.value.Else.value.elseKeyword;
    bodyCursor = bodyCursor.value.Else.value.body;
  }

  result.push(
    FormatUnit.Sequence(
      formatVerbatim(ctx, elseCursor),
      space,
      optionallyBlockStatement(ctx, bodyCursor, semicolon)
    )
  );

  return result;
}

function formatAssignment(ctx: FormatContext, node: ParseNode<Assignment>): FormatUnit {
  return FormatUnit.Sequence(
    formatVerbatim(ctx, node.value.symbol),
    space,
    FormatUnit.Span("="),
    space,
    formatExpression(ctx, node.value.value)
  );
}

function formatBalancedList<T>(
  ctx: FormatContext,
  node: ParseNode<Array<ParseNode<T>>>,
  delimiters: [string, string],
  formatter: (ctx: FormatContext, node: ParseNode<T>) => FormatUnit,
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
        contents: [formatter(ctx, element), ...(separator === null ? [] : [separator])],
      })
    ),
    options
  );
}

function optionallyParenthesizeBlock(unit: FormatUnit): FormatAlternative {
  return FormatUnit.Alternative(unit, FormatUnit.Block(["(", ")"], unit));
}

function optionallyBlockStatement(
  ctx: FormatContext,
  node: ParseNode<Statement>,
  end: FormatSpan
): FormatUnit {
  // Never wrap a do statement in another block
  if (node.value.kind === "Do") return formatStatement(ctx, node, end);

  return FormatUnit.Alternative(
    formatStatement(ctx, node, end),
    FormatUnit.Block(["do #[", `]${end.span}`], formatStatement(ctx, node, semicolon))
  );
}

function formatType(ctx: FormatContext, node: ParseNode<Type>): FormatUnit {
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
      Tuple: ({ members }) => formatBalancedList(ctx, members, ["(", ")"], formatType, commaSpace),
      Union: ({ left, right }): FormatSequence => ({
        kind: "sequence",
        contents: [formatType(ctx, left), space, pipe, space, formatType(ctx, right)],
      }),
      Reference: ({ name, genericParameters }): FormatSequence => ({
        kind: "sequence",
        contents: [
          formatVerbatim(ctx, name),
          ...(genericParameters
            ? [formatBalancedList(ctx, genericParameters, ["[", "]"], formatType, commaSpace)]
            : []),
        ],
      }),
      Function: ({ fnKeyword, parameters, arrowToken, returnType }): FormatSequence => ({
        kind: "sequence",
        contents: [
          formatVerbatim(ctx, fnKeyword),
          formatBalancedList(ctx, parameters, ["(", ")"], formatType, commaSpace),
          space,
          formatVerbatim(ctx, arrowToken),
          space,
          optionallyParenthesizeBlock(formatType(ctx, returnType)),
        ],
      }),
    }) ?? unimplemented(node.value.kind)
  );
}

/**
 * Formats a node as a verbatim string.
 *
 * This function handles the tricky business of emitting comments that are attached to verbatim nodes. If you want
 * comments to appear on this node, you must pass the `previousNode` parameter. If you instead pass `null`, the comments
 * will always be emitted _inline_. This is useful for nodes where the previous node may not be knowable.
 *
 * @param node - The node to emit
 * @param previousNode - The node that came before this one, or null to disable comments on this node
 * @returns A FormatUnit that emits the node
 */
function formatVerbatim(ctx: FormatContext, node: ParseNode<string>): FormatUnit {
  // If this node has comments, it's a bit of trouble for us to handle them...

  const visitableComments =
    node.commentRanges?.filter(
      (range) => !DODGED_COMMENTS.has(`${range[0].absolute}:${range[1].absolute}`)
    ) ?? [];

  if (visitableComments.length > 0) {
    // Four cases:
    // 1. Comment and self are both inline.
    // ... /* comment */ self
    //
    // 2. Comment and self are on a single, new line.
    // ...
    //   /* comment */ self
    //
    // 3. Comment is inline, self is on a separate line.
    // ... /* comment */
    //     self
    //
    // 4. Comment and self are on two separate lines.
    // ...
    //   /* comment */
    //   self
    //
    // Only cases 3 and 4 allow single line (//) comments.
    // Fuck it, we're only going to treat everything like 1 and 3. We don't know if the comment is on a different line
    // as the previous node, so we can't handle 4 and 2.

    uncolorCommentRanges(ctx.data, ...visitableComments);

    const commentAndSelfAreDifferentLine = visitableComments[0][1].line < node.range[0].line;

    if (commentAndSelfAreDifferentLine) {
      return FormatUnit.Body(
        ...spitCommentBody(ctx, visitableComments, node.range[0].line),
        FormatUnit.Span(node.value)
      );
    } else {
      return FormatUnit.Sequence(
        ...visitableComments.map((c) =>
          FormatUnit.Sequence(FormatUnit.Span(slice(ctx.data, c)), space)
        ),
        FormatUnit.Span(node.value)
      );
    }
  }

  return FormatUnit.Span(node.value);
}

const DODGED_COMMENTS = new Set<string>();

function dodgeCommentRanges(data: Uint8Array, ...ranges: Range[]): void {
  for (const range of ranges) {
    const rangeString = `${range[0].absolute}:${range[1].absolute}`;
    const existed = COMMENT_RANGES.has(rangeString);

    if (!existed) {
      debug && console.error(`ERR: Comment range did not exist: ${rangeString}`);
    } else {
      debug &&
        console.error(`Dodged comment range: ${rangeString} ${JSON.stringify(slice(data, range))}`);
    }

    DODGED_COMMENTS.add(rangeString);
  }
}

const COMMENT_RANGES = new Set<string>();

function uncolorCommentRanges(data: Uint8Array, ...ranges: Range[]): void {
  for (const range of ranges) {
    const rangeString = `${range[0].absolute}:${range[1].absolute}`;
    const existed = COMMENT_RANGES.delete(rangeString);

    if (!existed) {
      debug && console.error(`ERR: Comment range did not exist: ${rangeString}`);
    } else {
      debug &&
        console.error(
          `Uncolored comment range: ${rangeString} ${JSON.stringify(slice(data, range))}`
        );
    }
  }
}

const debug = !!process.env.DEBUG;

const visited = new Set<object>();
function colorCommentRanges(
  data: Uint8Array,
  node: { commentRanges?: Range[]; value: object }
): void {
  visited.add(node);

  if (node.commentRanges) {
    for (const range of node.commentRanges) {
      const rangeString = `${range[0].absolute}:${range[1].absolute}`;
      const alreadyExists = COMMENT_RANGES.has(rangeString);
      COMMENT_RANGES.add(rangeString);

      debug &&
        !alreadyExists &&
        console.error(
          `Coloring comment range: ${rangeString} ${JSON.stringify(slice(data, range))}`
        );
    }
  }

  for (const child of Object.values(node)) {
    if (typeof child === "object" && child !== null && !visited.has(child)) {
      // console.log("visiting", child);
      colorCommentRanges(data, child as any);
    }
  }
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

  colorCommentRanges(fileData, parsed.result);

  const formatted = writeFile(toFormatBody(ctx, parsed.result), {
    indent: "  ",
    maxLineLength: 80,
  });

  console.log(formatted);

  // If we failed to mark any comment ranges, then we throw an error
  if (COMMENT_RANGES.size !== 0) {
    console.error("ERROR: failed to visit all comment ranges");

    for (const range of COMMENT_RANGES) {
      console.error(JSON.stringify(range));
    }

    process.exit(1);
  }
}

function unimplemented(message?: string): never {
  throw new Error(message === undefined ? "Not implemented." : `Not implemented: ${message}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
