import type {
  ArithmeticOp,
  Assignment,
  BindingPattern,
  CompareOp,
  Declaration,
  Expression,
  GenericParameter,
  InterfaceField,
  LogicalOp,
  Module,
  ParameterDeclaration,
  ParseNode,
  RecordElement,
  Statement,
  Type,
  TypeConstraint,
  UnaryOp,
} from "@serendipity/parser";

const ZERO_LOCATION = { line: 0, column: 0, absolute: 0 };
const ZERO_RANGE = [ZERO_LOCATION, ZERO_LOCATION] as const;

export function node<T>(value: T): ParseNode<T> {
  return {
    range: [{ ...ZERO_LOCATION }, { ...ZERO_LOCATION }],
    value,
    hasError: false,
  };
}

export function nodes<T>(values: Array<T | ParseNode<T>>): ParseNode<Array<ParseNode<T>>> {
  return node(values.map((value) => (isParseNode(value) ? value : node(value))));
}

export function isParseNode<T = unknown>(value: unknown): value is ParseNode<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "range" in value &&
    "hasError" in value
  );
}

export function module(declarations: Array<ParseNode<Declaration>>): Module {
  return { declarations };
}

export const expr: Record<string, any> = {
  number(value = "0"): Expression {
    return { kind: "Number", 0: value } as unknown as Expression;
  },
  string(value = ""): Expression {
    return { kind: "String", 0: value } as unknown as Expression;
  },
  boolean(value = false): Expression {
    return { kind: "Boolean", 0: value } as unknown as Expression;
  },
  name(value = "_"): Expression {
    return { kind: "Name", 0: value } as unknown as Expression;
  },
  hole(): Expression {
    return { kind: "Hole" };
  },
  none(): Expression {
    return { kind: "None" };
  },
  unary(operator: UnaryOp = { kind: "Minus" }, expression = expr.hole()): Expression {
    return { kind: "Unary", operator: node(operator), expression: node(expression) };
  },
  arithmetic(operator: ArithmeticOp = { kind: "Add" }, left = expr.hole(), right = expr.hole()): Expression {
    return { kind: "Arithmetic", operator: node(operator), left: node(left), right: node(right) };
  },
  compare(operator: CompareOp = { kind: "Equal" }, left = expr.hole(), right = expr.hole()): Expression {
    return { kind: "Compare", operator: node(operator), left: node(left), right: node(right) };
  },
  logical(operator: LogicalOp = { kind: "And" }, left = expr.hole(), right = expr.hole()): Expression {
    return { kind: "Logical", operator: node(operator), left: node(left), right: node(right) };
  },
  accessor(accessee = expr.hole(), index = expr.hole()): Expression {
    return { kind: "Accessor", accessee: node(accessee), index: node(index) };
  },
  fieldAccess(accessee = expr.hole(), field = "field"): Expression {
    return { kind: "FieldAccess", accessee: node(accessee), field: node(field) };
  },
  fn(parameters: ParameterDeclaration[] = [], body = expr.hole()): Expression {
    return {
      kind: "Function",
      fnKeyword: node("fn"),
      parameters: nodes(parameters),
      arrowToken: node("->"),
      body: node(body),
    };
  },
  call(callee = expr.hole(), parameters: Expression[] = []): Expression {
    return { kind: "Call", callee: node(callee), parameters: nodes(parameters) };
  },
  with(bindings: Assignment[] = [assignment("_", expr.hole())], body = expr.hole()): Expression {
    return { kind: "With", withKeyword: node("with"), bindings: nodes(bindings), body: node(body) };
  },
  tuple(elements: Expression[] = []): Expression {
    return { kind: "Tuple", elements: nodes(elements) };
  },
  list(elements: Expression[] = []): Expression {
    return { kind: "List", elements: nodes(elements) };
  },
  procedure(body: Statement[] = [stmt.pass()]): Expression {
    return { kind: "Procedure", body: nodes(body) };
  },
  if(condition = expr.hole(), then = expr.hole(), Else = expr.hole()): Expression {
    return {
      kind: "If",
      ifKeyword: node("if"),
      condition: node(condition),
      thenKeyword: node("then"),
      then: node(then),
      elseKeyword: node("else"),
      Else: node(Else),
    };
  },
  record(elements: RecordElement[] = []): Expression {
    return { kind: "Record", elements: nodes(elements) };
  },
};

export const stmt: Record<string, any> = {
  let(symbol = "_", value = expr.hole()): Statement {
    return { kind: "Let", letKeyword: node("let"), assignment: node(assignment(symbol, value)) };
  },
  set(symbol = "_", value = expr.hole()): Statement {
    return { kind: "Set", 0: node(assignment(symbol, value)) } as unknown as Statement;
  },
  if(condition = expr.hole(), then = stmt.pass(), Else = stmt.pass()): Statement {
    return {
      kind: "If",
      ifKeyword: node("if"),
      condition: node(condition),
      thenKeyword: node("then"),
      then: node(then),
      Else: node({ elseKeyword: node("else"), body: node(Else) }),
    };
  },
  forIn(binding = "item", iterator = expr.hole(), body = stmt.pass()): Statement {
    return {
      kind: "ForIn",
      forKeyword: node("for"),
      binding: node(binding),
      inKeyword: node("in"),
      iterator: node(iterator),
      body: node(body),
    };
  },
  forever(body = stmt.pass()): Statement {
    return { kind: "Forever", 0: node(body) } as unknown as Statement;
  },
  do(body = expr.hole()): Statement {
    return { kind: "Do", 0: node(body) } as unknown as Statement;
  },
  break(): Statement {
    return { kind: "Break" };
  },
  continue(): Statement {
    return { kind: "Continue" };
  },
  pass(): Statement {
    return { kind: "Pass" };
  },
  expression(body = expr.hole()): Statement {
    return { kind: "Expression", 0: node(body) } as unknown as Statement;
  },
};

export const decl = {
  main(body = expr.procedure([stmt.expression(expr.call(expr.name("print"), [expr.string("hello from Camino")]))])): ParseNode<Declaration> {
    return node({ kind: "Main", mainKeyword: node("main"), body: node(body) });
  },
  const(identifier = "value", value = expr.hole()): ParseNode<Declaration> {
    return node({
      kind: "Const",
      constKeyword: node("const"),
      identifier: node(identifier),
      equalsToken: node("="),
      value: node(value),
    });
  },
  function(identifier = "fn", parameters: ParameterDeclaration[] = [], body = expr.hole()): ParseNode<Declaration> {
    return node({
      kind: "Function",
      functionKeyword: node("fn"),
      identifier: node(identifier),
      parameters: nodes(parameters),
      arrowToken: node("->"),
      body: node(body),
    });
  },
  import(identifier = "module", moduleSpecifier = "./module"): ParseNode<Declaration> {
    return node({
      kind: "Import",
      importKeyword: node("import"),
      pattern: node(pattern.identifier(identifier)),
      equalToken: node("="),
      useKeyword: node("use"),
      moduleSpecifier: node(moduleSpecifier),
    });
  },
  export(elements: RecordElement[] = [recordElement.identifier("value")]): ParseNode<Declaration> {
    return node({ kind: "Export", exportKeyword: node("export"), elements: nodes(elements) });
  },
  typeAlias(name = "Alias", value = type.reference("Value")): ParseNode<Declaration> {
    return node({
      kind: "TypeAlias",
      typeKeyword: node("type"),
      name: node(name),
      equalsToken: node("="),
      value: node(value),
    });
  },
  interface(name = "Shape", body: InterfaceField[] = []): ParseNode<Declaration> {
    return node({ kind: "Interface", interfaceKeyword: node("interface"), name: node(name), body: nodes(body) });
  },
};

export const pattern = {
  identifier(name = "_"): BindingPattern {
    return { kind: "Identifier", name: node(name) };
  },
  tuple(patterns: BindingPattern[] = []): BindingPattern {
    return { kind: "Tuple", patterns: nodes(patterns) };
  },
  record(elements: Array<{ kind: "Identifier"; name: ParseNode<string> }> = []): BindingPattern {
    return { kind: "Record", elements: nodes(elements) as any };
  },
};

export const type: Record<string, any> = {
  reference(name = "Any"): Type {
    return { kind: "Reference", name: node(name) };
  },
  tuple(members: Type[] = []): Type {
    return { kind: "Tuple", members: nodes(members) };
  },
  union(left = type.reference("A"), right = type.reference("B")): Type {
    return { kind: "Union", left: node(left), right: node(right) };
  },
  intersection(left = type.reference("A"), right = type.reference("B")): Type {
    return { kind: "Intersection", left: node(left), right: node(right) };
  },
  fn(parameters: Type[] = [], returnType: Type | undefined = undefined): Type {
    return {
      kind: "Function",
      fnKeyword: node("fn"),
      parameters: nodes(parameters),
      returnType: node(returnType ? { arrowToken: node("->"), type: node(returnType) } : undefined),
    };
  },
};

export function parameter(name = "_"): ParameterDeclaration {
  return { name: node(name) };
}

export function genericParameter(name = "T"): GenericParameter {
  return { name: node(name) };
}

export function assignment(symbol = "_", value = expr.hole()): Assignment {
  return { symbol: node(symbol), equalToken: node("="), value: node(value) };
}

export function typeConstraint(value = type.reference("Any")): TypeConstraint {
  return { colonToken: node(":"), type: node(value) };
}

export const recordElement = {
  keyValue(key = "key", value = expr.hole()): RecordElement {
    return { kind: "KeyValuePair", key: node(key), value: node(value) };
  },
  identifier(name = "value"): RecordElement {
    return { kind: "Identifier", name: node(name) };
  },
  spread(value = expr.hole()): RecordElement {
    return { kind: "Spread", value: node(value) };
  },
};

export const EMPTY_RANGE = ZERO_RANGE;
