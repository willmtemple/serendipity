import os from "node:os";

/**
 * A unit of formatting that can be written to a file.
 */
export type FormatUnit =
  | FormatReflow
  | FormatSpan
  | FormatSequence
  | FormatBody
  | FormatBlock
  | FormatAlternative
  | undefined;

export const FormatUnit = {
  Block: (
    delimiters: [string, string],
    ...contents: FormatUnit[]
  ): FormatBlock => ({
    kind: "block",
    delimiters,
    contents,
  }),

  Body: (contents: Iterable<FormatUnit>): FormatBody => ({
    kind: "body",
    contents,
  }),

  Reflow: (
    delimiters: [string, string],
    contents: Iterable<FormatUnit>,
    options: ReflowOptions = {}
  ): FormatReflow => {
    const reflow: FormatReflow = {
      kind: "reflow",
      delimiters,
      contents,
    };

    for (const [key, value] of Object.entries(options))
      reflow[key as keyof ReflowOptions] = value;

    return reflow;
  },

  Sequence: (...contents: FormatUnit[]): FormatSequence => ({
    kind: "sequence",
    contents,
  }),

  Span: (span: string): FormatSpan => ({
    kind: "span",
    span,
  }),

  Alternative: (
    preferred: FormatUnit,
    alternative: FormatUnit
  ): FormatAlternative => ({
    kind: "alternative",
    preferred,
    alternative,
  }),
} as const satisfies {
  [K in Extract<FormatUnit, object>["kind"] as Capitalize<K>]: (
    ...args: never[]
  ) => Extract<FormatUnit, { kind: K }>;
};

/**
 * A span is a unit that contains a single string.
 */
export interface FormatSpan {
  kind: "span";
  span: string;
}

/**
 * A reflow is a unit that contains a sequence of units that might span multiple lines if the whole span is too long.
 */
export interface FormatReflow {
  kind: "reflow";
  delimiters: [string, string];
  contents: Iterable<FormatUnit>;
  trimPostfix?: string;
  cushion?: string;
}

/**
 * Options for a reflow.
 */
export interface ReflowOptions {
  trimPostfix?: string;
  cushion?: string;
}

/**
 * An alternative is a unit that contains an alternative unit that may be chosen if the preferred one is too long.
 */
export interface FormatAlternative {
  kind: "alternative";
  preferred: FormatUnit;
  alternative: FormatUnit;
}

/**
 * A sequence is a unit that contains a sequence of units.
 */
export interface FormatSequence {
  kind: "sequence";
  contents: Iterable<FormatUnit>;
}

/**
 * A body is a unit that contains a sequence of units that are separated by a line break.
 */
export interface FormatBody {
  kind: "body";
  contents: Iterable<FormatUnit>;
}

/**
 * A block is a unit that contains a sequence of units that are separated by a line break and are enclosed in a
 * pair of delimiters.
 */
export interface FormatBlock {
  kind: "block";
  contents: Iterable<FormatUnit>;
  delimiters: [string, string];
}

export interface FormatConfig {
  indent: string;
  lineBreak: string;
  maxLineLength: number;
}

export const DefaultFormatConfig: FormatConfig = {
  indent: "  ",
  lineBreak: os.EOL,
  maxLineLength: 80,
};

interface FormatContext {
  config: FormatConfig;
  indentLevel: number;
  currentLine: string;
  lines: string[];
  lineDirty: boolean;

  newLine(): void;
  write(text: string): void;
  finalize(): string;
  indent(): void;
  unindent(): void;
}

function createFormatContext(config: FormatConfig): FormatContext {
  const self: FormatContext = {
    config,
    indentLevel: 0,
    currentLine: "",
    lines: [],
    lineDirty: false,

    newLine() {
      self.lines.push(self.currentLine.trimEnd());
      // Indent the next line
      self.currentLine = config.indent.repeat(self.indentLevel);
      self.lineDirty = false;
    },
    write(text: string) {
      self.lineDirty = true;
      self.currentLine += text;
    },
    finalize() {
      return self.lines.join(config.lineBreak);
    },
    indent() {
      if (self.lineDirty) throw new Error("Cannot indent a dirty line");
      self.indentLevel++;
      self.currentLine = config.indent.repeat(self.indentLevel);
    },
    unindent() {
      if (self.lineDirty) throw new Error("Cannot unindent a dirty line");
      self.indentLevel--;
      self.currentLine = config.indent.repeat(self.indentLevel);
    },
  };

  return self;
}

export function formatFile(
  contents: Iterable<FormatUnit>,
  config?: Partial<FormatConfig>
): string {
  const ctx = createFormatContext(
    Object.freeze({ ...DefaultFormatConfig, ...config })
  );

  for (const block of contents) {
    writeBlock(ctx, block);
    ctx.newLine();
  }

  return ctx.finalize();
}

function writeBlock(ctx: FormatContext, block: FormatUnit): void {
  if (!block) return;

  switch (block.kind) {
    case "span":
      writeSpan(ctx, block);
      break;
    case "reflow":
      writeReflow(ctx, block);
      break;
    case "sequence":
      writeSequence(ctx, block);
      break;
    case "body":
      writeBody(ctx, block);
      break;
    case "block":
      writeBlockBody(ctx, block);
      break;
    case "alternative":
      writeAlternative(ctx, block);
      break;
    default:
      return unreachable(block);
  }
}

function writeSpan(ctx: FormatContext, span: FormatSpan): void {
  ctx.write(span.span);
}

function writeReflow(ctx: FormatContext, reflow: FormatReflow): void {
  const minimumLineLength = getFullLineLength(reflow);

  if (
    isNaN(minimumLineLength) ||
    minimumLineLength + ctx.currentLine.length > ctx.config.maxLineLength
  ) {
    ctx.write(reflow.delimiters[0]);
    ctx.newLine();
    ctx.indent();
    for (const block of reflow.contents) {
      writeBlock(ctx, block);
      ctx.newLine();
    }

    ctx.unindent();
    ctx.write(reflow.delimiters[1]);
  } else {
    ctx.write(reflow.delimiters[0]);
    ctx.write(reflow.cushion ?? "");
    for (const block of reflow.contents) {
      writeBlock(ctx, block);
    }

    if (reflow.trimPostfix && ctx.currentLine.endsWith(reflow.trimPostfix)) {
      ctx.currentLine = ctx.currentLine.slice(0, -reflow.trimPostfix.length);
    }

    ctx.write(reflow.cushion ?? "");
    ctx.write(reflow.delimiters[1]);
  }
}

function writeSequence(ctx: FormatContext, sequence: FormatSequence): void {
  for (const block of sequence.contents) {
    writeBlock(ctx, block);
  }
}

function writeBody(ctx: FormatContext, body: FormatBody): void {
  for (const block of body.contents) {
    writeBlock(ctx, block);
    ctx.newLine();
  }
}

function writeBlockBody(ctx: FormatContext, body: FormatBlock): void {
  ctx.write(body.delimiters[0]);
  ctx.newLine();
  ctx.indent();
  for (const block of body.contents) {
    writeBlock(ctx, block);
    ctx.newLine();
  }
  ctx.unindent();
  ctx.write(body.delimiters[1]);
}

function writeAlternative(
  ctx: FormatContext,
  alternative: FormatAlternative
): void {
  const minimumLineLength = getFullLineLength(alternative);

  if (
    isNaN(minimumLineLength) ||
    minimumLineLength + ctx.currentLine.length > ctx.config.maxLineLength
  ) {
    writeBlock(ctx, alternative.alternative);
  } else {
    writeBlock(ctx, alternative.preferred);
  }
}

const BLOCK_FULL_LENGTH = new WeakMap<Extract<FormatUnit, object>, number>();

/**
 * A memoized helper that computes the minimum line length of a block;
 *
 * This function returns NaN if the block _must_ include a line break.
 *
 * @param block - The block to compute the minimum line length of.
 * @returns The minimum line length of the block, or NaN if the block must break a line.
 */
function getFullLineLength(block: FormatUnit): number {
  if (!block) return 0;

  if (BLOCK_FULL_LENGTH.has(block)) {
    return BLOCK_FULL_LENGTH.get(block)!;
  }

  const length = _getFullLineLength(block);

  BLOCK_FULL_LENGTH.set(block, length);

  return length;
}

function _getFullLineLength(block: Extract<FormatUnit, object>): number {
  switch (block.kind) {
    case "span":
      return block.span.length;
    case "reflow": {
      const delimiterLength =
        block.delimiters[0].length + block.delimiters[1].length;
      const fullLength =
        delimiterLength +
        Array.from(block.contents).reduce(
          (acc, block) => acc + getFullLineLength(block),
          0
        );

      const postFixLength = block.trimPostfix?.length ?? 0;

      const cushionLength = (block.cushion?.length ?? 0) * 2;

      return fullLength + postFixLength + cushionLength;
    }
    case "sequence": {
      const contentsArray = Array.from(block.contents);

      return contentsArray.reduce(
        (acc, block) => acc + getFullLineLength(block),
        0
      );
    }
    case "alternative":
      return getFullLineLength(block.preferred);
    case "body":
      return NaN;
    case "block":
      return NaN;
    default:
      return unreachable(block);
  }
}

function unreachable(value: never): never {
  throw new Error(`Unreachable: ${value}`);
}
