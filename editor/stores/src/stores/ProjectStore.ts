import { action, autorun, makeAutoObservable, observable, set, toJS } from "mobx";

import { surfaceExample } from "../defaultProject";

import guid from "uuid/v4";

import { SyntaxObject } from "@serendipity/syntax";
import { Module } from "@serendipity/syntax-surface";
import {
  Define,
  DefineFunction,
  Expression,
  Global,
  Main,
  Statement
} from "@serendipity/syntax-surface";

interface Position {
  x: number;
  y: number;
}

const KEY_PROJECT = "userProject";

export interface EditorMetadata {
  guid: string;
  pos: Position;
}

interface EditorMetadataWrapper {
  editor: EditorMetadata;
  [k: string]: any;
}

export interface EditorMain extends Main {
  metadata: EditorMetadataWrapper;
}
export interface EditorDefine extends Define {
  metadata: EditorMetadataWrapper;
}
export interface EditorDefineFunction extends DefineFunction {
  metadata: EditorMetadataWrapper;
}

interface EditorDetachedSyntaxBase {
  kind: "_editor_detachedsyntax";
  metadata: EditorMetadataWrapper;
}

export interface EditorDetachedExpression extends EditorDetachedSyntaxBase {
  syntaxKind: "expression";
  element: Expression;
}

export interface EditorDetachedStatements extends EditorDetachedSyntaxBase {
  syntaxKind: "statement";
  element: Statement[];
}

export type EditorDetachedSyntax = EditorDetachedStatements | EditorDetachedExpression;

export type EditorGlobal =
  | EditorMain
  | EditorDefine
  | EditorDefineFunction
  | EditorDetachedExpression
  | EditorDetachedStatements;

export type EditorUnregisteredGlobal =
  | Omit<EditorMain, "metadata">
  | Omit<EditorDefine, "metadata">
  | Omit<EditorDefineFunction, "metadata">
  | Omit<EditorDetachedExpression, "metadata">
  | Omit<EditorDetachedStatements, "metadata">;

export interface EditorModule {
  globals: EditorGlobal[];
}

export class ProjectStore {
  public program: EditorModule = {
    globals: []
  };

  private byGUID: { [k: string]: SyntaxObject } = {};

  constructor() {
    console.trace("Creating new proeject store.");
    makeAutoObservable(this);
    const storedData = localStorage.getItem(KEY_PROJECT);
    if (storedData) {
      set(this.program, JSON.parse(storedData));
    } else {
      set(this.program, surfaceExample);
    }

    this.loadGUIDTable();

    let firstRun = true;
    autorun(() => {
      const json = JSON.stringify(toJS(this.program));
      if (!firstRun) {
        localStorage.setItem(KEY_PROJECT, json);
      }
      firstRun = false;
    });
  }

  /**
   * Returns the "clean" AST with no detached syntax objects,
   * suitable for passing into the compiler.
   */
  get canonicalProgram(): Module {
    return {
      globals: toJS(this.program).globals.filter(
        (g) => g.kind !== "_editor_detachedsyntax"
      ) as Global[]
    };
  }

  /**
   * Clear the entire program
   */
  public clear() {
    this.program.globals = [];
    this.byGUID = {};
  }

  /**
   * Delete a node from the AST by integer index
   * @param idx the index of the global to remove
   */
  public rmNode(idx: number) {
    const glb = this.program.globals[idx];
    if (glb) {
      this.program.globals.splice(idx, 1);
      delete this.byGUID[glb.metadata.editor.guid];
    }
  }

  /**
   * Delete a node from the AST by its GUID
   * @param guid the unique id of the global node to remove
   */
  public rmNodeByGUID(id: string) {
    this.program.globals = this.program.globals.filter((glb) => glb.metadata.editor.guid !== id);
    delete this.byGUID[id];
  }

  public reset() {
    // TODO find some way to get rid of distinction between editor module
    // and stx module
    this.program = surfaceExample as EditorModule;
    this.loadGUIDTable();
  }

  public insertInto(vid: string, into: string, key: string, idx?: number) {
    console.log("Insert", vid, "into", into, key, idx);
    const parent = this.byGUID[into];
    const setNode = action((n: any, mode?: string) => {
      const l = parent && (parent as any)[key];
      console.log("INSERT", n, mode);
      if (l) {
        if (idx !== undefined && l[idx]) {
          console.log("idx-based insert");
          if (mode === "statement" && l[idx].kind !== "@hole") {
            (parent as any)[key] = (l as any[]).concat(n as any[]);
          } else if (mode === "statement") {
            (parent as any)[key] = n;
          } else {
            (parent as any)[key][idx] = n;
          }
          this.rmNodeByGUID(this.metadataFor(v).guid);
          return;
        } else if (idx === undefined) {
          console.log("non-idx insert");
          if (mode === "statement") {
            // Break the first statement of the list off
            (parent as any)[key] = (n as any[]).splice(0, 1)[0];
            // Clean up v if it is done
            if (n.length === 0) {
              this.rmNodeByGUID(this.metadataFor(v).guid);
            }
          } else {
            (parent as any)[key] = n;
            this.rmNodeByGUID(this.metadataFor(v).guid);
          }
          return;
        }
      }

      throw new Error("No such key(s) on that object");
    });

    const v = this.byGUID[vid] as EditorDetachedSyntax;
    if (!v || !v.hasOwnProperty("syntaxKind")) {
      throw new Error("No such node to be inserted " + v);
    }

    setNode(v.element, v.syntaxKind);
  }

  public detachExpression(id: string, key: string, pos: Position, idx?: number): string {
    const parent = this.byGUID[id];
    const node = (() => {
      const v = parent && (parent as any)[key];
      if (idx !== undefined) {
        return v[idx];
      } else {
        return v;
      }
    })();

    if (!node) {
      throw new Error("No such key(s) on that object during 'get'");
    }

    const setNode = action((n: Expression) => {
      const v = parent && (parent as any)[key];
      if (v) {
        if (idx !== undefined && v[idx]) {
          v[idx] = n;
          return;
        } else if (idx === undefined) {
          (parent as any)[key] = n;
          return;
        }
      }

      throw new Error("No such key(s) on that object");
    });

    const newGlobalObject: EditorGlobal = observable({
      kind: "_editor_detachedsyntax",
      syntaxKind: "expression",
      element: node as Expression,
      metadata: {
        editor: {
          guid: guid(),
          pos: { ...pos }
        }
      }
    });

    const newHole = {
      kind: "@hole",
      metadata: {
        editor: {
          guid: guid()
        }
      }
    } as const;
    setNode(newHole);
    this.byGUID[newHole.metadata!.editor.guid] = newHole;

    // Put the clone onto the globals stack
    this.byGUID[newGlobalObject.metadata.editor.guid] = newGlobalObject;
    this.program.globals.push(newGlobalObject);

    return newGlobalObject.metadata.editor.guid;
  }

  public detachStatement(id: string, key: string, pos: Position, idx?: number): string {
    const parent = this.byGUID[id];
    const node = (() => {
      const v = parent && (parent as any)[key];
      if (idx !== undefined) {
        return v[idx];
      } else {
        return v;
      }
    })();

    if (!node) {
      throw new Error("No such key(s) on that object during 'get'");
    }

    const killNode = action((): Statement[] => {
      const v = parent && (parent as any)[key];
      if (v) {
        if (idx !== undefined && v[idx]) {
          const l = v as any[];
          if (l.length > 1 && idx !== 0) {
            return (v as any[]).splice(idx, v.length - idx);
          } else {
            const g = guid();
            (parent as any)[key] = [
              {
                kind: "@hole",
                metadata: {
                  editor: {
                    guid: g
                  }
                }
              }
            ];
            return v;
          }
        } else if (idx === undefined) {
          const g = guid();
          const old = (parent as any)[key];
          (parent as any)[key] = {
            kind: "@hole",
            metadata: {
              editor: {
                guid: g
              }
            }
          };
          return [old];
        }
      }

      throw new Error("No such key(s) on that object");
    });

    const newGlobalObject = observable({
      kind: "_editor_detachedsyntax",
      syntaxKind: "statement",
      element: killNode(),
      metadata: {
        editor: {
          guid: guid(),
          pos: { ...pos }
        }
      }
    } as const);

    // Put the clone onto the globals stack
    this.byGUID[newGlobalObject.metadata.editor.guid] = newGlobalObject;
    this.program.globals.push(newGlobalObject);

    return newGlobalObject.metadata.editor.guid;
  }

  public addGlobal(newGlobal: EditorUnregisteredGlobal, pos?: Position): string {
    const g = observable(newGlobal) as EditorGlobal;
    this.loadSyntaxObject(g);
    const id = this.metadataFor(g as SyntaxObject).guid;
    this.updatePos(id, pos ?? { x: 0, y: 0 });
    this.program.globals.push(g);
    return id;
  }

  public dump() {
    console.log(toJS(this.program));
  }

  public getText(): string {
    return JSON.stringify(
      toJS(this.program.globals.filter((g) => g.kind !== "_editor_detachedsyntax")),
      undefined,
      2
    );
  }

  public bump(idx: number) {
    if (idx + 1 < this.program.globals.length) {
      const g = this.program.globals.splice(idx, 1);
      this.program.globals.push(g[0]);
    }
  }

  public initMetadata(g: EditorGlobal) {
    if (!g.metadata) {
      g.metadata = {
        editor: {
          guid: guid(),
          pos: {
            x: 0,
            y: 0
          }
        }
      };
    }
  }

  public updatePos(id: string, pos: Position) {
    const glb = this.byGUID[id];
    if (glb) {
      this.metadataFor(glb).pos = pos;
    } else {
      console.warn("No such guid exists", guid, pos);
    }
  }

  public metadataFor(node: SyntaxObject) {
    return node.metadata!.editor as EditorMetadata;
  }

  public loadGUID(node: SyntaxObject): string {
    if (!node.metadata) {
      node.metadata = {
        editor: {
          guid: guid()
        }
      };
    } else if (!node.metadata.editor) {
      node.metadata.editor = {
        guid: guid()
      };
    } else if (!node.metadata.editor.guid) {
      node.metadata.editor.guid = guid();
    }

    this.byGUID[node.metadata.editor.guid] = node;

    return node.metadata.editor.guid;
  }

  private loadSyntaxObject(v: any) {
    if (typeof v === "object") {
      if (v.hasOwnProperty("kind") || v.hasOwnProperty("syntaxKind")) {
        this.loadGUID(v);
      }

      Object.keys(v)
        .filter((k) => k !== "kind" && k !== "metadata")
        .forEach((k) => {
          this.loadSyntaxObject(v[k]);
        });
    }
  }

  private loadGUIDTable() {
    this.byGUID = {};

    // Bootstrap the process with the globals.
    this.program.globals.forEach((g) => {
      this.initMetadata(g);
      this.byGUID[this.loadGUID(g)] = g;
      this.loadSyntaxObject(g);
    });
  }
}

export const DefaultProjectStore = new ProjectStore();
