import type {
  Declaration,
  Expression,
  Module,
  ParseNode,
  RecordElement,
  Statement,
} from "@serendipity/parser";

function op(value: { kind: string }) {
  return {
    Add: "+",
    Subtract: "-",
    Multiply: "*",
    Divide: "/",
    Modulus: "%",
    Equal: "==",
    NotEqual: "!=",
    LessThan: "<",
    LessThanOrEqual: "<=",
    GreaterThan: ">",
    GreaterThanOrEqual: ">=",
    And: "and",
    Or: "or",
    Negate: "not",
    Minus: "-",
  }[value.kind] ?? value.kind;
}

function printRecordElement(element: ParseNode<RecordElement>): string {
  switch (element.value.kind) {
    case "Identifier":
      return element.value.name.value;
    case "KeyValuePair":
      return `${element.value.key.value}: ${printExpression(element.value.value)}`;
    case "Spread":
      return `...${printExpression(element.value.value)}`;
    default:
      return String((element.value as { kind?: string }).kind ?? "record-element");
  }
}

function printStatement(statement: ParseNode<Statement>): string {
  const value = statement.value;
  switch (value.kind) {
    case "Let":
      return `let ${value.assignment.value.symbol.value} = ${printExpression(value.assignment.value.value)}`;
    case "Set":
      return `set ${value[0].value.symbol.value} = ${printExpression(value[0].value.value)}`;
    case "If":
      return `if ${printExpression(value.condition)} then ${printStatement(value.then)}${
        value.Else ? ` else ${printStatement(value.Else.value.body)}` : ""
      }`;
    case "ForIn":
      return `for ${value.binding.value} in ${printExpression(value.iterator)} ${printStatement(value.body)}`;
    case "Forever":
      return `forever ${printStatement(value[0])}`;
    case "Do":
      return `do ${printExpression(value[0])}`;
    case "Break":
      return "break";
    case "Continue":
      return "continue";
    case "Pass":
      return "pass";
    case "Expression":
      return printExpression(value[0]);
    default:
      return String((value as { kind?: string }).kind ?? "statement");
  }
}

function printExpression(expression: ParseNode<Expression>): string {
  const value = expression.value;
  switch (value.kind) {
    case "Number":
    case "Name":
      return value[0];
    case "String":
      return JSON.stringify(value[0]);
    case "Boolean":
      return String(value[0]);
    case "Hole":
      return "...";
    case "None":
      return "none";
    case "As":
      return `${printExpression(value.expr)} as ${value.type.value.kind}`;
    case "Unary":
      return `${op(value.operator.value)} ${printExpression(value.expression)}`;
    case "Compare":
    case "Arithmetic":
    case "Logical":
      return `${printExpression(value.left)} ${op(value.operator.value)} ${printExpression(value.right)}`;
    case "Accessor":
      return `${printExpression(value.accessee)}[${printExpression(value.index)}]`;
    case "FieldAccess":
      return `${printExpression(value.accessee)}.${value.field.value}`;
    case "Function":
      return `fn (${value.parameters.value.map((p) => p.value.name.value).join(", ")}) -> ${printExpression(value.body)}`;
    case "Call":
      return `${printExpression(value.callee)}(${value.parameters.value.map(printExpression).join(", ")})`;
    case "With":
      return `with ${value.bindings.value
        .map((binding) => `${binding.value.symbol.value} = ${printExpression(binding.value.value)}`)
        .join(", ")} ${printExpression(value.body)}`;
    case "Tuple":
      return `(${value.elements.value.map(printExpression).join(", ")})`;
    case "List":
      return `[${value.elements.value.map(printExpression).join(", ")}]`;
    case "Procedure":
      return `#[${value.body.value.map(printStatement).join("; ")}]`;
    case "If":
      return `if ${printExpression(value.condition)} then ${printExpression(value.then)} else ${printExpression(value.Else)}`;
    case "Record":
      return `{${value.elements.value.map(printRecordElement).join(", ")}}`;
    default:
      return String((value as { kind?: string }).kind ?? "expression");
  }
}

function printDeclaration(declaration: ParseNode<Declaration>): string {
  const value = declaration.value;
  switch (value.kind) {
    case "Main":
      return `main ${printExpression(value.body)}`;
    case "Const":
      return `const ${value.identifier.value} = ${printExpression(value.value)}`;
    case "Function":
      return `fn ${value.identifier.value}(${value.parameters.value
        .map((param) => param.value.name.value)
        .join(", ")}) -> ${printExpression(value.body)}`;
    case "Import":
      return `import ${value.pattern.value.kind} use ${JSON.stringify(value.moduleSpecifier.value)}`;
    case "Export":
      return `export {${value.elements.value.map(printRecordElement).join(", ")}}`;
    case "TypeAlias":
      return `type ${value.name.value} = ${value.value.value.kind}`;
    case "Interface":
      return `interface ${value.name.value} { ${value.body.value.length} fields }`;
    default:
      return String((value as { kind?: string }).kind ?? "declaration");
  }
}

export function printModule(module: Module): string {
  return module.declarations.map(printDeclaration).join("\n\n");
}
