import { action, autorun, observable, set, toJS } from 'mobx';

import { surfaceExample } from 'proto-syntax/dist/test/examples';

import * as uuid from 'uuid/v4';

import { Define, DefineFunction, Main } from 'proto-syntax/dist/lib/lang/syntax/surface/global';

const P_NAME = 'userProject';

export interface IPos {
    x: number,
    y: number,
}

export interface IEditorMetadata {
    guid: string,
    pos: IPos
}

export interface IEditorMetadataWrapper {
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

export type IEditorGlobal = IEditorMain | IEditorDefine | IEditorDefineFunction;

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

    @action public delete() {
        this.program.globals = [];
    }

    @action public rmNode(idx: number) {
        this.program.globals.splice(idx, 1);
    }

    @action public rmNodeByGUID(guid: string) {
        this.program.globals = this.program.globals.filter((glb) =>
            glb.metadata.editor.guid !== guid
        );
    }

    @action public reset() {
        // TODO find some way to get rid of distinction between editor module
        // and stx module
        this.program = surfaceExample as IEditorModule;
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
}

export default new ProjectStore();