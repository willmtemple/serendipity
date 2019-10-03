import { action, autorun, computed, observable, set, toJS } from 'mobx';

import { surfaceExample } from '@serendipity/syntax/dist/test/examples';

import guid from 'uuid/v4';

import * as expr from '@serendipity/syntax/dist/lib/lang/syntax/surface/expression';

import { SyntaxObject } from '@serendipity/syntax/dist/lib/lang/syntax';
import { Module } from '@serendipity/syntax/dist/lib/lang/syntax/surface';
import { Expression } from '@serendipity/syntax/dist/lib/lang/syntax/surface/expression';
import { Define, DefineFunction, Global, Main } from '@serendipity/syntax/dist/lib/lang/syntax/surface/global';
import { Statement } from '@serendipity/syntax/dist/lib/lang/syntax/surface/statement';
import { IPosition } from 'util/Position';

const P_NAME = 'userProject';

export interface IEditorMetadata {
    guid: string,
    pos: IPosition
}

interface IEditorMetadataWrapper {
    editor: IEditorMetadata,
    [k: string]: any
}

export interface IEditorMain extends Main {
    metadata: IEditorMetadataWrapper
}
export interface IEditorDefine extends Define {
    metadata: IEditorMetadataWrapper
}
export interface IEditorDefineFunction extends DefineFunction {
    metadata: IEditorMetadataWrapper
}

interface IEditorDetachedSyntaxBase {
    globalKind: "_editor_detachedsyntax"
    metadata: IEditorMetadataWrapper,
}

export interface IEditorDetachedExpression extends IEditorDetachedSyntaxBase {
    syntaxKind: "expression",
    element: Expression
}

export interface IEditorDetachedStatements extends IEditorDetachedSyntaxBase {
    syntaxKind: "statement",
    element: Statement[]
}

export type IEditorDetachedSyntax =
    IEditorDetachedStatements
    | IEditorDetachedExpression;

export type IEditorGlobal =
    IEditorMain
    | IEditorDefine
    | IEditorDefineFunction
    | IEditorDetachedExpression
    | IEditorDetachedStatements;

export type IEditorUnregisteredGlobal = 
    Omit<IEditorMain, "metadata">
    | Omit<IEditorDefine, "metadata">
    | Omit<IEditorDefineFunction, "metadata">
    | Omit<IEditorDetachedExpression, "metadata">
    | Omit<IEditorDetachedStatements, "metadata">;

export interface IEditorModule {
    globals: IEditorGlobal[]
}

export class ProjectStore {

    @observable public program: IEditorModule = {
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
        this.program = surfaceExample as IEditorModule;
        this.loadGUIDTable();
    }

    @action public insertInto(vid: string, into: string, key: string, idx?: number) {
        const parent = this.byGUID[into];
        const setNode = action((n: any, k: string) => {
            const l = parent && parent[key];
            if (l) {
                if (idx !== undefined && l[idx]) {
                    if (k === "statement" && l[idx].statementKind !== "@hole") {
                        parent[key] = (l as any[]).concat(n as any[]);
                    } else {
                        l[idx] = n[0];
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

        const v = this.byGUID[vid];
        if (!v || !v.hasOwnProperty("syntaxKind")) {
            throw new Error("No such node to be inserted " + v);
        }

        const kind = (v as IEditorDetachedSyntax).syntaxKind;
        const e = (v as IEditorDetachedExpression).element;

        setNode(e, kind);
        this.rmNodeByGUID(this.metadataFor(v).guid);
    }

    @action public detachExpression(id: string, key: string, pos: IPosition, idx?: number): string {
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

        const newGlobalObject: IEditorGlobal = observable({
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

    @action public detachStatement(id: string, key: string, pos: IPosition, idx?: number): string {
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

        const newGlobalObject: IEditorGlobal = observable({
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

    @action public register(g : IEditorUnregisteredGlobal) : IEditorGlobal {
        const id = this.loadGUID(g as IEditorGlobal);
        this.updatePos(id, {x: 0, y: 0});
        return g as IEditorGlobal;
    }

    @action public addGlobal(g : IEditorUnregisteredGlobal) {
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

    @action public initMetadata(g: IEditorGlobal) {
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

    @action public updatePos(id: string, pos: IPosition) {
        const glb = this.byGUID[id];
        if (glb) {
            this.metadataFor(glb).pos = pos;
        } else {
            console.warn("No such guid exists", guid, pos);
        }
    }

    public metadataFor(node: SyntaxObject) {
        return node.metadata!.editor as IEditorMetadata
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