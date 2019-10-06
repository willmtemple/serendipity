import * as _global from "./global";
import * as _expression from "./expression";
import * as _statement from "./statement";

export import global = _global;
export import statement = _statement;
export import expression = _expression;

// TODO move this out to a runtime or a module package... it isn't really syntax

/**
 * A module definition, containing the set of globals
 */
export interface Module {
  /** In our language, the global declarations are considered to be unordered. */
  globals: _global.Global[];
}
