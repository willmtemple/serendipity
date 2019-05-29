import { action, autorun, computed, observable, set, toJS } from 'mobx';

import { surfaceExample } from 'proto-syntax/dist/test/examples';

import * as uuid from 'uuid/v4';

import { Module } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { Expression } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import { Define, DefineFunction, Global, Main } from 'proto-syntax/dist/lib/lang/syntax/surface/global';
import { Statement } from 'proto-syntax/dist/lib/lang/syntax/surface/statement';

const P_NAME = 'userProject';

export interface IPos {
    x: number,
    y: number,
}

export interface IEditorMetadata {
    guid: string,
    pos: IPos
}

interface IEditorMetadataWrapper {
        editor: IEditorMetadata,
        [k: string] : any
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

    private byGUID: { [k: string]: IEditorGlobal };

    constructor() {
        const that = this;
        this.byGUID = {};
        const storedData = localStorage.getItem(P_NAME);
        if (storedData) {
            set(this.program, JSON.parse(storedData));
        } else {
            set(this.program, surfaceExample);
        }

        this.program.globals.forEach((glb, idx) => {
            this.initMetadata(idx);
            this.byGUID[glb.metadata.editor.guid] = glb;
        });

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
    @computed get canonicalProgram() : Module {
        return {
            globals : (this.program.globals.filter((g) =>
                g.globalKind !== "_editor_detachedsyntax"
            )) as Global[]
        }
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
    @action public rmNodeByGUID(guid: string) {
        this.program.globals = this.program.globals.filter((glb) =>
            glb.metadata.editor.guid !== guid
        );
        delete this.byGUID[guid];
    }

    @action public reset() {
        // TODO find some way to get rid of distinction between editor module
        // and stx module
        this.program = surfaceExample as IEditorModule;
        this.byGUID = {};
        this.program.globals.forEach((glb, idx) => {
            this.initMetadata(idx);
            this.byGUID[glb.metadata.editor.guid] = glb;
        });
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

    @action public initMetadata(idx: number) {
        const glb = this.program.globals[idx];
        if (glb) {
            if (!glb.metadata) {
                glb.metadata = {
                    editor: {
                        guid: uuid(),
                        pos: {
                            x: 0,
                            y: 0
                        }
                    }
                };
            }
        }
    }

    @action public updatePos(guid: string, pos: IPos) {
        const glb = this.byGUID[guid];
        if (glb) {
            glb.metadata.editor.pos = pos;
        }
    }

    @action public insNodeDev(pos: IPos) {
        this.program.globals.push({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: {
                exprKind: "number",
                value: 10
            },
            metadata: {
                editor: {
                    guid: uuid(),
                    pos
                }
            }
        })
    }
}

export default new ProjectStore();