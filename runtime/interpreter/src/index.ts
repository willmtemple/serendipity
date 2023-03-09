// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

/// <reference lib="es6" />

// TODO: rewrite this whole module

import {
  Module,
  BinaryOperator,
  BinaryOp,
  Expression,
  UnaryOp,
  UnaryOperator,
} from "@serendipity/syntax-abstract";

import { match } from "omnimatch";

import { Value, NumberV, IntrinsicV } from "./value";
import { Binder, Scope } from "./scope";
import path from "node:path";

function _isTotalType(v: Value): boolean {
  switch (v.kind) {
    case "none":
    case "number":
    case "string":
    case "boolean":
      return true;
    default:
      return false;
  }
}

function getTruthValue(v: Value): boolean {
  if (v.kind === "none" || (v.kind === "boolean" && v.value === false)) {
    return false;
  } else {
    return true;
  }
}

function arithOp(l: NumberV, r: NumberV, op: BinaryOperator): Value {
  const lv = l.value;
  const rv = r.value;
  switch (op) {
    case "*":
      return { kind: "number", value: lv * rv };
    case "/":
      return { kind: "number", value: lv / rv };
    case "-":
      return { kind: "number", value: lv - rv };
    case "+":
      return { kind: "number", value: lv + rv };
    case "%":
      return { kind: "number", value: lv % rv };
    default:
      throw new Error("Encountered unimplemented arithmetic operator " + op);
  }
}

function isEq(lv: Value, rv: Value): boolean {
  if (_isTotalType(lv)) {
    if (lv.kind === "none" || rv.kind === "none") {
      // Voids are always equal
      return true;
    } else if (lv.kind === "intrinsic" || rv.kind === "intrinsic") {
      return lv === rv;
    } else {
      return lv.value === rv.value;
    }
  } else {
    return lv === rv;
  }
}

function compareOp(lv: Value, rv: Value, op: BinaryOperator): Value {
  return {
    kind: "boolean",
    value: (() => {
      if (lv.kind !== rv.kind) {
        return false;
      }

      let negate = false;
      let result;
      switch (op) {
        case "!=":
          negate = true;
        // eslint-disable-next-line no-fallthrough
        case "==":
          return negate ? !isEq(lv, rv) : isEq(lv, rv);
        case ">":
          negate = true;
        // eslint-disable-next-line no-fallthrough
        case "<=":
          if (_isTotalType(lv)) {
            if (lv.kind === "none") {
              // Voids are always equal
              result = true;
            } else if (
              (lv.kind === "string" || lv.kind === "number") &&
              (rv.kind === "string" || rv.kind === "number")
            ) {
              result = lv.value <= rv.value;
            } else {
              throw new Error("Cannot compare booleans.");
            }
          } else {
            throw new Error("Cannot compare incomplete values.");
          }
          return negate ? !result : result;
        case "<":
          negate = true;
        // eslint-disable-next-line no-fallthrough
        case ">=":
          if (_isTotalType(lv)) {
            if (lv.kind === "none") {
              // Voids are always equal
              result = true;
            } else if (lv.kind === "intrinsic") {
              return false;
            } else if (
              (lv.kind === "string" || lv.kind === "number") &&
              (rv.kind === "string" || rv.kind === "number")
            ) {
              result = lv.value >= rv.value;
            } else {
              throw new Error("Cannot compare booleans.");
            }
          } else {
            throw new Error("Cannot compare incomplete values.");
          }
          return negate ? !result : result;
        default:
          throw new Error("Unimplemented comparison operator " + op);
      }
    })(),
  };
}

type Printer = (s: string) => void;
type Prompter = (s?: string) => string;

export interface InterpreterOptions {
  corePath?: string;
  getAssociatedExports: (m: Module) => string[];
  loadModule: (path: string) => Promise<Module>,
  printer: Printer;
  prompt: Prompter;
  beforeEval: (expr: Expression, scope: Scope) => void;
}

const defaultOptions: InterpreterOptions = {
  getAssociatedExports() {
    throw new Error("Core module requested, but no export loader is available.")
  },
  loadModule() {
    throw new Error("No loadModule function provided to interpreter");
  },
  printer() {
    throw new Error("No print function provided to interpreter");
  },
  prompt() {
    throw new Error("No prompt function provided to interpeter");
  },
  beforeEval: () => {
    /* empty */
  },
};

export class Interpreter {
  private options: InterpreterOptions;

  private moduleExportMap: Map<string, { module: Module, binder: Binder }> = new Map();

  public constructor(options: Partial<InterpreterOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  public async execModule(m: Module, modulePath: string): Promise<void> {
    const scope: Scope = new Scope((e, s) => this.evalExpr(e, s, modulePath));

    if (this.options.corePath) {
      // We do this for its side effect of loading the module into core.
      const { canonicalizedPath } = await this.loadModule(modulePath, this.options.corePath);

      scope.scope("__module_core", {
        kind: "Call",
        callee: {
          kind: "Name",
          name: "__core.import",
        },
        parameter: {
          kind: "String",
          value: canonicalizedPath,
        }
      })

      const coreModule = this.moduleExportMap.get(canonicalizedPath);
      if (!coreModule) throw new Error("Core module not found");

      const { module } = coreModule;

      const associatedCoreExports = this.options.getAssociatedExports(module);

      for (const name of associatedCoreExports) {
        scope.scope(name, {
          kind: "Call",
          callee: {
            kind: "Name",
            name: "__module_core",
          },
          parameter: {
            kind: "String",
            value: name,
          }
        })
      }
    }

    let main = false;
    for (const { name: _name, value } of m.definitions) {
      if (_name === "__start") {
        main = true;
      }
      scope.scope(_name, value);
    }

    if (main) {
      this.evalExpr(
        {
          kind: "Name",
          name: "__start",
        },
        scope,
        modulePath
      );
    }
  }

  public async evalModuleExports(m: Module, modulePath: string): Promise<Binder> {
    const scope: Scope = new Scope((e, s) => this.evalExpr(e, s, modulePath));

    for (const { name: _name, value } of m.definitions) {
      scope.scope(_name, value);
    }

    return scope.bind({
      kind: "Name",
      name: "__exports",
    });
  }

  // TODO: remove this in favor of a core module and think hard about what
  // should be in core
  private getIntrinsic(scope: Scope, name: string, executionPath: string): IntrinsicV {
    if (name === "__core") {
      const that = this;
      return {
        kind: "intrinsic",
        async fn(key) {
          if (!key) throw new Error("accessed/called __core with no key");

          if (key.kind !== "string") throw new Error("__core only has string properties");

          return that.getIntrinsic(scope, "__core." + key.value, executionPath);
        },
      };
    }

    switch (name.split(".")[1]) {
      case "import": {
        return {
          kind: "intrinsic",
          fn: async (parameter) => {
            if (!parameter || parameter.kind !== "string") {
              throw new Error(`Expected a string argument to 'import', got '${parameter?.kind}'`);
            }

            const {
              moduleExports,
              canonicalizedPath
            } = await this.loadModule(executionPath, parameter.value);

            // Evaluate the exports in their own scope.
            return this.evalExpr(moduleExports.expr, moduleExports.scope, canonicalizedPath);
          },
        }
      }
      case "print_stmt":
        return {
          kind: "intrinsic",
          fn: async (param?: Value): Promise<Value> => {
            if (!param) {
              throw new Error("Called print_stmt intrinsic with no parameter.");
            }

            this.options.printer(await this._strconv(param, executionPath));

            return {
              kind: "closure",
              value: {
                body: scope.bind({
                  kind: "Name",
                  name: "__ident",
                }),
                parameter: "__ident",
              },
            };
          },
        };
      case "read_line":
        return {
          kind: "intrinsic",
          fn: async (param?: Value) => {
            if (param && param.kind !== "string") {
              throw new Error("readline: prompt must be a string!");
            }

            let result: string;
            if (param && param.kind === "string") {
              result = this.options.prompt(param.value);
            } else {
              result = this.options.prompt();
            }

            return {
              kind: "string",
              value: result,
            };
          },
        };
      case "str_split":
        return {
          kind: "intrinsic",
          fn: async (str?: Value) => {
            if (!str || str.kind !== "string") {
              throw new Error("str_split: no string provided");
            }

            return {
              kind: "intrinsic",
              fn: async (splitOn?: Value) => {
                if (!splitOn || (splitOn.kind !== "string" && splitOn.kind !== "number")) {
                  throw new Error("str_split: no splitOn provided (must be string or number)");
                }

                let leftStr: string;
                let rightStr: string;
                if (splitOn.kind === "string") {
                  const split = str.value.split(splitOn.value, 2);
                  if (split.length !== 2) {
                    throw new Error("str_split: split delimiter not found");
                  }
                  [leftStr, rightStr] = split as [string, string];
                } else {
                  if (splitOn.value > str.value.length) {
                    throw new Error("str_split: index out of bounds");
                  }
                  [leftStr, rightStr] = [
                    str.value.substring(0, splitOn.value),
                    str.value.substring(splitOn.value, str.value.length),
                  ];
                }

                const emptyScope = new Scope((e, s) => this.evalExpr(e, s, executionPath));

                return {
                  kind: "tuple",
                  value: [
                    {
                      expr: {
                        kind: "String",
                        value: leftStr,
                      },
                      scope: emptyScope,
                    },
                    {
                      expr: {
                        kind: "String",
                        value: rightStr,
                      },
                      scope: emptyScope,
                    },
                  ],
                };
              },
            };
          },
        };
      case "str_cat":
        return {
          kind: "intrinsic",
          fn: async (rightStr?: Value) => {
            if (!rightStr || rightStr.kind !== "string") {
              throw new Error("str_join: no leftStr provided");
            }

            return {
              kind: "intrinsic",
              fn: async (leftStr?: Value) => {
                if (!leftStr || leftStr.kind !== "string") {
                  throw new Error("str_join: no rightStr provided");
                }

                return {
                  kind: "string",
                  value: leftStr.value + rightStr.value,
                };
              },
            };
          },
        };
      case "to_str":
        return {
          kind: "intrinsic",
          fn: async (v: Value) => {
            if (!v) throw new Error("no argument provided to_str");

            return {
              kind: "string",
              value: await this._strconv(v, executionPath),
            };
          },
        };
      case "err":
        return {
          kind: "intrinsic",
          fn: async (v: Value) => {
            console.error("panic:", await this._strconv(v, executionPath));
            process.exit(1);
          }
        }
      default:
        throw new Error("Unimplemented intrinsic " + name);
    }
  }

  private async loadModule(executionPath: string, modulePath: string) {
    const canonicalizedPath = path.resolve(path.dirname(executionPath), modulePath);

    let moduleExports: Binder;
    if (this.moduleExportMap.has(canonicalizedPath)) {
      ({ binder: moduleExports } = this.moduleExportMap.get(canonicalizedPath)!);
    } else {
      const module = await this.options.loadModule(canonicalizedPath);

      moduleExports = await this.evalModuleExports(module, canonicalizedPath);

      this.moduleExportMap.set(canonicalizedPath, {
        module,
        binder: moduleExports,
      });
    }
    return { moduleExports, canonicalizedPath };
  }

  private async _strconv(v: Value, executionPath: string): Promise<string> {
    switch (v.kind) {
      case "number":
        return v.value.toString();
      case "string":
        return v.value;
      case "boolean":
        return v.value ? "true" : "false";
      case "none":
        return v.kind;
      case "tuple": {
        const vals = await Promise.all(v.value.map((bind) => this.evalExpr(bind.expr, bind.scope, executionPath)));
        return "(" + vals.map((v: Value) => this._strconv(v, executionPath)).join(", ") + ")";
      }
      default: {
        const attrs: string[] = [];
        for (const k of Object.keys(v)) {
          if (Object.prototype.hasOwnProperty.call(v, k)) {
            attrs.push(k + "=(" + v[k as keyof Value].toString() + ")");
          }
        }

        return "#" + v.kind + "{" + attrs.join(", ") + "}";
      }
    }
  }

  private async binaryOperator({ op, left, right }: BinaryOp, scope: Scope, modulePath: string): Promise<Value> {
    const lv = await this.evalExpr(left, scope, modulePath);
    const rv = await this.evalExpr(right, scope, modulePath);
    switch (op) {
      case BinaryOperator.ADD:
      case BinaryOperator.SUB:
      case BinaryOperator.MUL:
      case BinaryOperator.DIV:
      case BinaryOperator.MOD:
        if (lv.kind !== "number" || rv.kind !== "number") {
          throw new Error("Attempted to do arithmetic on non-numbers");
        } else {
          return arithOp(lv, rv, op);
        }

      default:
        return compareOp(lv, rv, op);
    }
  }

  private async unaryOperator({ op, expr }: UnaryOp, scope: Scope, modulePath: string): Promise<Value> {
    const val = await this.evalExpr(expr, scope, modulePath);
    switch (op) {
      case UnaryOperator.MINUS:
        if (val.kind !== "number") {
          throw new Error("Attempted unary minus on a non-number");
        }

        return {
          kind: "number",
          value: -val.value,
        };

      case UnaryOperator.NEGATE:
        return {
          kind: "boolean",
          value: !getTruthValue(val),
        };
    }
  }

  private async evalExpr(e: Expression, scope: Scope, modulePath: string): Promise<Value> {
    this.options.beforeEval(e, scope);
    return match(e, {
      Number: async ({ value }): Promise<Value> => ({ kind: "number", value }),
      String: async ({ value }): Promise<Value> => ({ kind: "string", value }),
      Boolean: async ({ value }): Promise<Value> => ({ kind: "boolean", value }),
      Name: async ({ name: _name }): Promise<Value> => {
        if (_name.startsWith("__core")) {
          return this.getIntrinsic(scope, _name, modulePath);
        }
        const res = scope.resolve(_name);
        if (!res) {
          throw new Error("name not found: " + _name);
        }

        return res;
      },
      Accessor: async ({ accessee, index }): Promise<Value> => {
        const aVal = await this.evalExpr(accessee, scope, modulePath);

        if (aVal.kind === "intrinsic") {
          return aVal.fn(await this.evalExpr(index, scope, modulePath));
        }

        if (aVal.kind !== "tuple") {
          throw new Error("Tried to access index on a non-tuple");
        }

        const iVal = await this.evalExpr(index, scope, modulePath);

        if (iVal.kind !== "number") {
          throw new Error("Tried to index an object with something that isn't a number");
        }

        if (iVal.value >= aVal.value.length) {
          throw new Error("Index out of bounds");
        }

        const resExpr = aVal.value[iVal.value]!;
        return this.evalExpr(resExpr.expr, resExpr.scope, modulePath);
      },
      Call: async ({ callee, parameter }): Promise<Value> => {
        const calleeValue = await this.evalExpr(callee, scope, modulePath);

        if (calleeValue.kind === "intrinsic") {
          // Handle intrinsics specially for now
          return calleeValue.fn(parameter ? await this.evalExpr(parameter, scope, modulePath) : undefined);
        }

        if (calleeValue.kind !== "closure") {
          throw new Error("Attempted to call a non-function");
        }

        // if (callee.kind === "Name" && callee.name === "__loop") debugger;

        const evalScope = new Scope((e, s) => this.evalExpr(e, s, modulePath), calleeValue.value.body.scope);

        // if (calleeValue.value.parameter === "__iter") debugger;

        if (parameter !== undefined) {
          if (calleeValue.value.parameter === undefined) {
            throw new Error("Callee does not accept a parameter, but one was given.");
          }
          if (calleeValue.value.parameter !== "" && calleeValue.value.parameter !== "_") {
            // if (calleeValue.value.parameter === "__iter") debugger;
            evalScope.rebind(calleeValue.value.parameter, scope.bind(parameter));
          }
        }

        return this.evalExpr(calleeValue.value.body.expr, evalScope, modulePath);
      },
      Closure: async ({ body, parameter }): Promise<Value> => ({
        kind: "closure",
        value: {
          body: scope.bind(body),
          parameter,
        },
      }),
      Tuple: async ({ values }): Promise<Value> => {
        const vals = values.map((exprBind) => scope.bind(exprBind));
        return {
          kind: "tuple",
          value: vals,
        };
      },
      If: async ({ cond, then, _else }): Promise<Value> => {
        if (getTruthValue(await this.evalExpr(cond, scope, modulePath))) {
          return this.evalExpr(then, scope, modulePath);
        } else {
          return this.evalExpr(_else, scope, modulePath);
        }
      },
      Case: async ({ _in, cases }) => {
        const value = await this.evalExpr(_in, scope, modulePath);
        for (const [k, v] of cases) {
          if (isEq(value, await this.evalExpr(k, scope, modulePath))) {
            return this.evalExpr(v, scope, modulePath);
          }
        }

        return { kind: "none" } as Value;
      },
      BinaryOp: (v) => this.binaryOperator(v, scope, modulePath),
      UnaryOp: (v) => this.unaryOperator(v, scope, modulePath),
      Void: async (): Promise<Value> => ({ kind: "none" }),
    });
  }
}
