
import { Function } from '../../../util/FuncTools';
import { SyntaxObject } from '../';
import { Statement } from './statement';

export type Expression =
    Number
    | String
    | Name
    | Accessor
    | Arithmetic
    | With
    | Call
    | Closure
    | List
    | Tuple
    | Procedure
    | If
    | Compare
    | Void
    | Hole;

export interface Number extends SyntaxObject {
    exprKind: "number",
    value: number,
}

export interface String extends SyntaxObject {
    exprKind: "string"
    value: string,
}

export interface Name extends SyntaxObject {
    exprKind: "name",
    name: string,
}

export interface Accessor extends SyntaxObject {
    exprKind: "accessor",
    accessee: Expression,
    index: Expression,
}

export interface Arithmetic extends SyntaxObject {
    exprKind: "arithmetic",
    op: "+" | "-" | "/" | "*" | "%",
    left: Expression,
    right: Expression,
}

export interface With extends SyntaxObject {
    exprKind: "with",
    binding: [string, Expression],
    expr: Expression,
}

export interface Call extends SyntaxObject {
    exprKind: "call",
    callee: Expression,
    parameters: Expression[],
}

export interface Closure extends SyntaxObject {
    exprKind: "closure",
    parameters: string[],
    body: Expression
}

export interface List extends SyntaxObject {
    exprKind: "list",
    contents: Expression[],
}

export interface Tuple extends SyntaxObject {
    exprKind: "tuple",
    values: Expression[],
}

export interface Procedure extends SyntaxObject {
    exprKind: "procedure",
    body: Statement[],
}

export interface If extends SyntaxObject {
    exprKind: "if",
    cond: Expression,
    then: Expression,
    _else: Expression
}

export interface Compare extends SyntaxObject {
    exprKind: "compare",
    op: "<" | ">" | "<=" | ">=" | "==" | "!=",
    left: Expression,
    right: Expression,

}

export interface Void extends SyntaxObject {
    exprKind: "void",
}

export interface Hole extends SyntaxObject {
    exprKind: "@hole"
}

// Expression tools

/**
 * An exhaustive definition of functions used to destructure an expression.
 */
export interface ExpressionPattern<T> {
    Accessor: Function<Accessor, T>,
    Arithmetic: Function<Arithmetic, T>,
    Number: Function<Number, T>,
    String: Function<String, T>,
    Name: Function<Name, T>,
    With: Function<With, T>,
    Call: Function<Call, T>,
    Closure: Function<Closure, T>,
    List: Function<List, T>,
    Tuple: Function<Tuple, T>,
    Procedure: Function<Procedure, T>,
    Void: Function<Void, T>,
    If: Function<If, T>,
    Compare: Function<Compare, T>,
    Hole: Function<Hole, T>
}

export interface ExhaustiveExpressionPattern<T> extends ExpressionPattern<T> {
    Default? : never,
}

export interface PartialExpressionPattern<T> extends Partial<ExpressionPattern<T>> {
    Default: (e: Expression) => T
}

export type ExpressionMatcher<T> = ExhaustiveExpressionPattern<T> | PartialExpressionPattern<T>;

/**
 * A function for destructuring an expression.
 * 
 * @param p An ExpressionPattern definition
 */
export function matchExpression<T>(p: ExpressionMatcher<T>): (e: Expression) => T {
    return (e: Expression): T => {
        switch (e.exprKind) {
            case "number":
                return p.Number ? p.Number(e as Number) : p.Default(e);
            case "string":
                return p.String ? p.String(e as String) : p.Default(e);
            case "name":
                return p.Name ? p.Name(e as Name) : p.Default(e);
            case "accessor":
                return p.Accessor ? p.Accessor(e as Accessor) : p.Default(e);
            case "arithmetic":
                return p.Arithmetic ? p.Arithmetic(e as Arithmetic) : p.Default(e);
            case "with":
                return p.With ? p.With(e as With) : p.Default(e);
            case "call":
                return p.Call ? p.Call(e as Call) : p.Default(e);
            case "closure":
                return p.Closure ? p.Closure(e as Closure) : p.Default(e);
            case "list":
                return p.List ? p.List(e as List) : p.Default(e);
            case "tuple":
                return p.Tuple ? p.Tuple(e as Tuple) : p.Default(e);
            case "procedure":
                return p.Procedure ? p.Procedure(e as Procedure) : p.Default(e);
            case "void":
                return p.Void ? p.Void(e as Void) : p.Default(e);
            case "if":
                return p.If ? p.If(e as If) : p.Default(e);
            case "compare":
                return p.Compare ? p.Compare(e as Compare) : p.Default(e);
            case "@hole":
                return p.Hole ? p.Hole(e as Hole) : p.Default(e);
            default:
                const __exhaust: never = e;
                return __exhaust;
        }
    }
}