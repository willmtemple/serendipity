import { autorun, toJS, observable, action, set } from 'mobx';

import { surfaceExample } from 'proto-syntax/dist/test/examples';

const uuidv4 = require('uuid/v4');

const P_NAME = 'userProject';

class ProjectStore {
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

    @observable program = {
        globals: []
    };

    @action delete() {
        this.program.globals = [];
    }

    @action rmNode(idx) {
        this.program.globals.splice(idx, 1);
    }

    @action rmNodeByGUID(guid) {
        this.program.globals = this.program.globals.filter((glb) => 
            glb.metadata.editor.guid !== guid
        );
    }

    @action reset() {
        this.program = surfaceExample;
        this.program.globals.forEach((glb, idx) => {
            this.initMetadata(idx);
            this.byGUID[glb.metadata.editor.guid] = glb;
        });
    }

    @action dump() {
        console.log(toJS(this.program))
    }

    @action bump(idx) {
        if (idx + 1 !== this.program.globals.length) {
            const g = this.program.globals.splice(idx, 1);
            this.program.globals.push(g[0])
        }
    }

    @action initMetadata(idx) {
        const glb = this.program.globals[idx];
        if (glb) {
            if (!glb.metadata) {
                glb.metadata = {};

                glb.metadata.editor = {
                    guid: uuidv4(),
                    pos: {
                        x: 0,
                        y: 0
                    }
                }
            }
        }
    }

    @action updatePos(guid, pos) {
        const glb = this.byGUID[guid];
        if (glb) {
            glb.metadata.editor.pos = pos;
        }
    }
}

export default new ProjectStore();