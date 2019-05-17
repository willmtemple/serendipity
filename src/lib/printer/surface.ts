import { Expression, matchExpression } from "../lang/syntax/surface/expression";
import { Statement, matchStatement } from "../lang/syntax/surface/statement";
import { Global, matchGlobal } from "../lang/syntax/surface/global";

export function writeExpression(e: Expression, level: number) : string {
    let accum = "";

    let indent = "";
    for (let i = 0; i < level; i++) {
        indent += "    ";
    }

    const wx = (e: Expression) => writeExpression(e, level);
    matchExpression<void>({
    Accessor: ({accessee, index}) => {
        accum += wx(accessee) + "." + wx(index);
    },
    Arithmetic: ({op, left, right}) => {
        accum += "("
            + [wx(left), op, wx(right)].join(" ")
            + ")";
    },
    Number: ({value}) => {
        accum += value;
    },
    String: ({value}) => {
        accum += "\"" + value + "\"";
    },
    Name: ({name}) => {
        accum += name;
    },
    With: ({binding: [name, value], expr}) => {
        accum += "with {" + name + " = " + wx(value) + "} (\n"
          + indent + "    " + writeExpression(expr, level + 1)
          + "\n" + indent + ")";
    },
    Call: ({callee, parameters}) => {
        accum += wx(callee)
            + "("
            + parameters.map(writeExpression).join(", ")
            + ")";
    },
    Closure: ({parameters, body}) => {
        accum += "((" + parameters.join(", ") + ") -> "
            + wx(body) + ")";
    },
    List: ({contents}) => {
        accum += "[" + contents.map(writeExpression).join(", ") + "]";
    },
    Tuple: ({values}) => {
        accum += "(" + values.map(writeExpression).join(", ") + ")";
    },
    Procedure: ({body}) => {
        accum += "[\n"
            + body.map((s) => writeStatement(s, level + 1, false)).join("\n")
            + "\n" + indent + "]";
    },
    Void: ({}) => {
        accum += "void";
    },
    If: ({cond, then, _else}) => {
        accum += "if " + wx(cond) + "\n"
            + indent + "    ? then " + wx(then) + "\n"
            + indent + "    : else " + wx(_else);
    },
    Compare: ({left, right, op}) => {
        accum += "("
            + [wx(left), op, wx(right)].join(" ")
            + ")";
    }
    })(e);
    return accum;
}

export function writeStatement(s: Statement, level: number, skipIndent: boolean) : string {
    let accum = "";
    let indent = ""
    if (!skipIndent) {
        for (let i = 0; i < level; i++) {
            indent += "    "
        }
    }
    accum += indent;

    matchStatement<void>({
        Print: ({value}) => {
            accum += "print " + writeExpression(value, level);
        },
        Let: ({name, value}) => {
            accum += "let " + name + " = " + writeExpression(value, level);
        },
        If: ({condition, body, _else}) => {
            accum += "if " + writeExpression(condition, level) + " then \n"
                + writeStatement(body, level + 1, false);
            if (_else) {
                accum += "\n" + indent + "else \n"
                    + writeStatement(_else, level+1, false);
            }
        },
        ForIn: ({value, binding, body}) => {
            accum += "for " + binding + " in " + writeExpression(value, level)
                + " " + writeStatement(body, level, true);
        },
        Forever: ({body}) => {
            accum += "forever " + writeStatement(body, level, true);
        },
        Do: ({body}) => {
            accum += "do " + writeExpression(body, level);
        },
        Break: (_) => {
            accum += "break";
        },
    })(s);
    return accum;
}

export function writeGlobal(g: Global) : string {
    let accum = "";
    matchGlobal<void>({
        Main: ({body}) => {
            accum += "main " + writeExpression(body, 0);
        },
        Define: ({name, value}) => {
            accum += "define " + name + " = " + writeExpression(value, 0); 
        },
        DefineFunction: ({name, parameters, body}) => {
            accum += "define " + name + "("
                + parameters.join(", ") + ") = "
                + writeExpression(body, 0);
        }
    })(g);
    return accum;
}