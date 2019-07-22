import { action, autorun, computed, observable, set, toJS } from 'mobx';

import { surfaceExample } from 'proto-syntax/dist/test/examples';

import * as guid from 'uuid/v4';

import * as expr from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import * as stmt from 'proto-syntax/dist/lib/lang/syntax/surface/statement';

import { SyntaxObject } from 'proto-syntax/dist/lib/lang/syntax';
import { Module } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { Expression } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import { Define, DefineFunction, Global, Main } from 'proto-syntax/dist/lib/lang/syntax/surface/global';
import { Statement } from 'proto-syntax/dist/lib/lang/syntax/surface/statement';
import { IPosition } from 'src/util/Position';

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

export interface IEditorDetachedStatement extends IEditorDetachedSyntaxBase {
    syntaxKind: "statement",
    element: Statement
}

export type IEditorDetachedSyntax =
    IEditorDetachedStatement
    | IEditorDetachedExpression;

export type IEditorGlobal =
    IEditorMain
    | IEditorDefine
    | IEditorDefineFunction
    | IEditorDetachedExpression
    | IEditorDetachedStatement;

export interface IEditorModule {
    globals: IEditorGlobal[]
}

export class ProjectStore {

    @observable public program: IEditorModule = {
        globals: []
    };

    private byGUID: { [k: string]: SyntaxObject };

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
        console.log(parent);
        const setNode = action((n: Expression) => {
            const l = parent && parent[key];
            console.log(l);
            if (l) {
                if (idx !== undefined && l[idx]) {
                    l[idx] = n;
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

        const e = (v as IEditorDetachedExpression).element;

        setNode(e);
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

        const setNode = action((n: Statement) => {
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
            syntaxKind: "statement",
            element: node as Statement,
            metadata: {
                editor: {
                    guid: guid(),
                    pos: { ...pos }
                }
            }
        });

        const newHole: stmt.Hole = {
            statementKind: "@hole",
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

    @action public addNode(o : Expression, pos? : IPosition) {
        const id = guid();
        this.loadGUID(o);
        const globalWrapper : IEditorDetachedSyntax = {
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: o,
            metadata: {
                editor: {
                    guid: id,
                    pos: pos || {
                        x: 0,
                        y: 0
                    }
                }
            }
        }
        this.byGUID[id] = globalWrapper;
        this.program.globals.push(globalWrapper);
    }

    @action public dump() {
        console.log(toJS(this.program))
    }

    @action public bump(idx: number) {
        if (idx + 1 !== this.program.globals.length) {
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

    @action private loadGUID(node: SyntaxObject): string {
        if (!node.metadata) {
            node.metadata = {
                editor: {
                    guid: guid(),
                }
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