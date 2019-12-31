import { action, autorun, computed, observable, set, toJS } from 'mobx';

import { surfaceExample } from '../example';

import guid from 'uuid/v4';

import * as expr from '@serendipity/syntax-surface/dist/expression';

import { SyntaxObject } from '@serendipity/syntax';
import { Module } from '@serendipity/syntax-surface';
import { Expression } from '@serendipity/syntax-surface/dist/expression';
import { Define, DefineFunction, Global, Main } from '@serendipity/syntax-surface/dist/global';
import { Statement } from '@serendipity/syntax-surface/dist/statement';

import { Position } from '../util/Position';

const P_NAME = 'userProject';

export interface EditorMetadata {
    guid: string,
    pos: Position
}

interface EditorMetadataWrapper {
    editor: EditorMetadata,
    [k: string]: any
}

export interface EditorMain extends Main {
    metadata: EditorMetadataWrapper
}
export interface EditorDefine extends Define {
    metadata: EditorMetadataWrapper
}
export interface EditorDefineFunction extends DefineFunction {
    metadata: EditorMetadataWrapper
}

interface EditorDetachedSyntaxBase {
    globalKind: "_editor_detachedsyntax"
    metadata: EditorMetadataWrapper,
}

export interface EditorDetachedExpression extends EditorDetachedSyntaxBase {
    syntaxKind: "expression",
    element: Expression
}

export interface EditorDetachedStatements extends EditorDetachedSyntaxBase {
    syntaxKind: "statement",
    element: Statement[]
}

export type EditorDetachedSyntax =
    EditorDetachedStatements
    | EditorDetachedExpression;

export type EditorGlobal =
    EditorMain
    | EditorDefine
    | EditorDefineFunction
    | EditorDetachedExpression
    | EditorDetachedStatements;

export type EditorUnregisteredGlobal =
    Omit<EditorMain, "metadata">
    | Omit<EditorDefine, "metadata">
    | Omit<EditorDefineFunction, "metadata">
    | Omit<EditorDetachedExpression, "metadata">
    | Omit<EditorDetachedStatements, "metadata">;

export interface EditorModule {
    globals: EditorGlobal[]
}

export class ProjectStore {

    @observable public program: EditorModule = {
        globals: []
    };

    private byGUID: { [k: string]: SyntaxObject } = {};

    constructor() {
        const that = this;
        const storedData = localStorage.getItem(P_NAME);
        if (storedData) {
            set(this.program, JSON.parse(storedData));
        } else {
            set(this.program, surfaceExample);
        }

        this.loadGUIDTable();

        let firstRun = true;
        autorun(() => {
            const json = JSON.stringify(toJS(that.program));
            if (!firstRun) {
                localStorage.setItem(P_NAME, json);
            }
            firstRun = false;
        });
    }

    /**
     * Returns the "clean" AST with no detached syntax objects,
     * suitable for passing into the compiler.
     */
    @computed get canonicalProgram(): Module {
        return {
            globals: (toJS(this.program).globals.filter((g) =>
                g.globalKind !== "_editor_detachedsyntax"
            )) as Global[]
        };
    }

    /**
     * Clear the entire program
     */
    @action public clear() {
        this.program.globals = [];
        this.byGUID = {};
    }

    /**
     * Delete a node from the AST by integer index
     * @param idx the index of the global to remove
     */
    @action public rmNode(idx: number) {
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
    @action public rmNodeByGUID(id: string) {
        this.program.globals = this.program.globals.filter((glb) =>
            glb.metadata.editor.guid !== id
        );
        delete this.byGUID[id];
    }

    @action public reset() {
        // TODO find some way to get rid of distinction between editor module
        // and stx module
        this.program = surfaceExample as EditorModule;
        this.loadGUIDTable();
    }

    @action public insertInto(vid: string, into: string, key: string, idx?: number) {
        const parent = this.byGUID[into];
        const setNode = action((n: any, mode?: string) => {
            const l = parent && parent[key];
            if (l) {
                if (idx !== undefined && l[idx]) {
                    if (mode === "statement" && l[idx].statementKind !== "@hole") {
                        parent[key] = (l as any[]).concat(n as any[]);
                    } else {
                        parent[key][idx] = n;
                    }
                    return
                } else if (idx === undefined) {
                    parent[key] = n;
                    return
                }
            }

            console.log(into, key, idx);
            throw new Error("No such key(s) on that object");
        });

        const v = this.byGUID[vid] as EditorDetachedSyntax;
        if (!v || !v.hasOwnProperty("syntaxKind")) {
            throw new Error("No such node to be inserted " + v);
        }

        const kind = v.syntaxKind;
        switch (kind) {
            case "expression":
                setNode(v.element);
                break;
            case "statement":
                setNode(v.element[0], "statement")
        }

        this.rmNodeByGUID(this.metadataFor(v).guid);
    }

    @action public detachExpression(id: string, key: string, pos: Position, idx?: number): string {
        const parent = this.byGUID[id];
        const node = (() => {
            const v = parent && parent[key];
            if (idx !== undefined) {
                return v[idx];
            } else {
                return v;
            }
        })();

        if (!node) { throw new Error("No such key(s) on that object during 'get'"); }

        const setNode = action((n: Expression) => {
            const v = parent && parent[key];
            if (v) {
                if (idx !== undefined && v[idx]) {
                    v[idx] = n;
                    return;
                } else if (idx === undefined) {
                    parent[key] = n;
                    return;
                }
            }

            throw new Error("No such key(s) on that object")
        });

        const newGlobalObject: EditorGlobal = observable({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: node as Expression,
            metadata: {
                editor: {
                    guid: guid(),
                    pos: { ...pos }
                }
            }
        });

        const newHole: expr.Hole = {
            exprKind: "@hole",
            metadata: {
                editor: {
                    guid: guid()
                }
            }
        };
        setNode(newHole);
        this.byGUID[newHole.metadata!.editor.guid] = newHole;

        // Put the clone onto the globals stack
        this.byGUID[newGlobalObject.metadata.editor.guid] = newGlobalObject;
        this.program.globals.push(newGlobalObject);

        return newGlobalObject.metadata.editor.guid;
    }

    @action public detachStatement(id: string, key: string, pos: Position, idx?: number): string {
        const that = this;
        const parent = this.byGUID[id];
        const node = (() => {
            const v = parent && parent[key];
            if (idx !== undefined) {
                return v[idx];
            } else {
                return v;
            }
        })();

        if (!node) { throw new Error("No such key(s) on that object during 'get'"); }

        const killNode = action(() => {
            const v = parent && parent[key];
            if (v) {
                if (idx !== undefined && v[idx]) {
                    const l = v as any[];
                    if (l.length > 1) {
                        (v as any[]).splice(idx, 1);
                    } else {
                        const g = guid();
                        v[idx] = {
                            statementKind: "@hole",
                            metadata: {
                                editor: {
                                    guid: g
                                }
                            }
                        };
                    }
                    return;
                } else if (idx === undefined) {
                    const g = guid();
                    parent[key] = {
                        statementKind: "@hole",
                        metadata: {
                            editor: {
                                guid: g
                            }
                        }
                    };
                    that.byGUID[g] = parent[key];
                    return;
                }
            }

            throw new Error("No such key(s) on that object")
        });

        const newGlobalObject: EditorGlobal = observable({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "statement",
            element: [node as Statement],
            metadata: {
                editor: {
                    guid: guid(),
                    pos: { ...pos }
                }
            }
        });

        killNode();

        // Put the clone onto the globals stack
        this.byGUID[newGlobalObject.metadata.editor.guid] = newGlobalObject;
        this.program.globals.push(newGlobalObject);

        return newGlobalObject.metadata.editor.guid;
    }

    @action public register(g: EditorUnregisteredGlobal): EditorGlobal {
        const id = this.loadGUID(g as EditorGlobal);
        this.updatePos(id, { x: 0, y: 0 });
        return g as EditorGlobal;
    }

    @action public addGlobal(g: EditorUnregisteredGlobal) {
        this.program.globals.push(this.register(g));
    }

    public dump() {
        console.log(toJS(this.program))
    }

    @action public bump(idx: number) {
        if ((idx + 1) < this.program.globals.length) {
            const g = this.program.globals.splice(idx, 1);
            this.program.globals.push(g[0])
        }
    }

    @action public initMetadata(g: EditorGlobal) {
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

    @action public updatePos(id: string, pos: Position) {
        const glb = this.byGUID[id];
        if (glb) {
            this.metadataFor(glb).pos = pos;
        } else {
            console.warn("No such guid exists", guid, pos);
        }
    }

    public metadataFor(node: SyntaxObject) {
        return node.metadata!.editor as EditorMetadata
    }

    @action public loadGUID(node: SyntaxObject): string {
        if (!node.metadata) {
            node.metadata = {
                editor: {
                    guid: guid(),
                }
            }
        } else if (!node.metadata.editor) {
            node.metadata.editor = {
                guid: guid(),
            }
        }

        this.byGUID[node.metadata.editor.guid] = node;

        return node.metadata.editor.guid;
    }

    private loadGUIDTable() {

        this.byGUID = {};

        // TODO: This is going to be some technical debt
        // I want to traverse the AST and dynamically figure out which
        // nodes are SyntaxObjects based on their ownprops and recursively
        // loadguid on all of them.
        const that = this;
        function considerSyntaxObject(v: any) {
            if (typeof v === "object") {
                if (v.hasOwnProperty("exprKind") || v.hasOwnProperty("statementKind")) {
                    that.loadGUID(v);
                }

                Object.keys(v).filter((k) => (
                    k !== "exprKind" && k !== "statementKind" && k !== "metadata"
                )).forEach((k) => {
                    if (v.hasOwnProperty) {
                        considerSyntaxObject(v[k]);
                    }
                })
            }
        }

        // Bootstrap the process with the globals.
        this.program.globals.forEach((g) => {
            this.initMetadata(g);
            this.byGUID[this.loadGUID(g)] = g;
            considerSyntaxObject(g);
        })
    }
}

export default new ProjectStore();