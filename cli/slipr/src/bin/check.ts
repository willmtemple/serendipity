// Copyright (c) Will Temple
// Licensed under the terms of the GNU General Public License v3 or later.

import fs from "node:fs/promises";

import { Module, parse, ParseNode } from "@serendipity/parser";
import path from "node:path";
import { match } from "omnimatch";

interface CheckHost {
  coreModule: string;
  loadFile: (file: string) => ReturnType<typeof loadFile>;
}

interface Scope {}

interface CheckContext {
  host: Readonly<CheckHost>;
  getScope: (module: Module) => Scope;
}

function createCheckContext(host: CheckHost): CheckContext {
  const scopeMap = new WeakMap<Module, Scope>();

  const self: CheckContext = {
    host: Object.freeze(host),
    getScope(module: Module) {
      if (scopeMap.has(module)) {
        return scopeMap.get(module)!;
      }

      const scope: Scope = {};

      scopeMap.set(module, scope);

      return scope;
    },
  };

  return self;
}

interface CheckResult {
  error: boolean;
}

async function checkFile(
  checkContext: CheckContext,
  filePath: string,
  file: ParseNode<Module>
): Promise<CheckResult> {
  // const moduleScope = checkContext.getScope(file.value);

  // const x = (0, y);
  // const y = (1, x);

  // 'x :- (number, 'y)
  // 'y :- (number, 'x)
  // 'x :- (number, (number, 'x))

  // type Seq = (number, Seq);

  for (const declaration of file.value.declarations) {
    await match(declaration.value, {
      Const: () => {
        // moduleScope.bindExpresion(identifier.value, value.value);
      },
      Function: () => {
        // moduleScope.bindFunction(fn.identifier.value, fn);
      },
      Interface: () => {
        unimplemented();
      },
      TypeAlias: () => {
        unimplemented();
      },
      Import: async ({ pattern, moduleSpecifier }) => {
        // Need to resolve imports to a file, load the file's exports, and bind
        // them to this module's scope.

        const result = await checkContext.host.loadFile(
          path.resolve(path.dirname(filePath), moduleSpecifier.value)
        );

        // If we can't resolve the module, then we type everything in the pattern as unknown and move on.
        if (result === undefined) {
          // TODO
          match(pattern.value, {
            Identifier: () => {
              unimplemented();
            },
          });
        } else {
          // otherwise, we bind the pattern entries to the module exports
          match(pattern.value, {
            Identifier: () => {
              unimplemented();
            },
          });
        }
      },
    });
  }

  return { error: false };
}

async function main() {
  const [file] = process.argv.slice(2);

  if (!file) {
    throw new Error("No file specified");
  }

  const canonicalizedPath = path.resolve(file);

  const parsed = await loadFile(canonicalizedPath);

  const checkContext = createCheckContext({
    coreModule: path.resolve(__dirname, "../../node_modules/@serendipity/core/lib.sdp"),
    loadFile,
  });

  const checkResult = await checkFile(checkContext, canonicalizedPath, parsed);

  if (checkResult.error) {
    throw checkResult;
  }

  console.log("ok");
}

const MODULES = new Map<string, ParseNode<Module>>();

async function loadFile(fileName: string): Promise<ParseNode<Module>> {
  if (MODULES.has(fileName)) {
    return MODULES.get(fileName)!;
  }

  const fileData = await fs.readFile(fileName);
  const parsed = parse(fileData);

  if (parsed.error || parsed.result === undefined) {
    for (const diagnostic of parsed.diagnostics) {
      const loc = Array.isArray(diagnostic.location) ? diagnostic.location[0] : diagnostic.location;
      console.log(
        fileName + ":" + (loc ? `${loc.line + 1}:${loc.column + 1}` : "<unk>"),
        "-",
        diagnostic.message
      );
    }
    process.exit(1);
  }

  MODULES.set(fileName, parsed.result);

  return parsed.result;
}

function unimplemented() {
  throw new Error("unimplemented");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
