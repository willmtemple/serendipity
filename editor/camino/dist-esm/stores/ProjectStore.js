import { __decorate } from "tslib";
import { action, autorun, computed, observable, set, toJS } from 'mobx';
import { surfaceExample } from '../example';
import guid from 'uuid/v4';
const P_NAME = 'userProject';
export class ProjectStore {
    constructor() {
        this.program = {
            globals: []
        };
        this.byGUID = {};
        const that = this;
        const storedData = localStorage.getItem(P_NAME);
        if (storedData) {
            set(this.program, JSON.parse(storedData));
        }
        else {
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
    get canonicalProgram() {
        return {
            globals: (toJS(this.program).globals.filter((g) => g.globalKind !== "_editor_detachedsyntax"))
        };
    }
    /**
     * Clear the entire program
     */
    clear() {
        this.program.globals = [];
        this.byGUID = {};
    }
    /**
     * Delete a node from the AST by integer index
     * @param idx the index of the global to remove
     */
    rmNode(idx) {
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
    rmNodeByGUID(id) {
        this.program.globals = this.program.globals.filter((glb) => glb.metadata.editor.guid !== id);
        delete this.byGUID[id];
    }
    reset() {
        // TODO find some way to get rid of distinction between editor module
        // and stx module
        this.program = surfaceExample;
        this.loadGUIDTable();
    }
    insertInto(vid, into, key, idx) {
        const parent = this.byGUID[into];
        const setNode = action((n, k) => {
            const l = parent && parent[key];
            if (l) {
                if (idx !== undefined && l[idx]) {
                    if (k === "statement" && l[idx].statementKind !== "@hole") {
                        parent[key] = l.concat(n);
                    }
                    else {
                        l[idx] = n[0];
                    }
                    return;
                }
                else if (idx === undefined) {
                    parent[key] = n;
                    return;
                }
            }
            console.log(into, key, idx);
            throw new Error("No such key(s) on that object");
        });
        const v = this.byGUID[vid];
        if (!v || !v.hasOwnProperty("syntaxKind")) {
            throw new Error("No such node to be inserted " + v);
        }
        const kind = v.syntaxKind;
        const e = v.element;
        setNode(e, kind);
        this.rmNodeByGUID(this.metadataFor(v).guid);
    }
    detachExpression(id, key, pos, idx) {
        const parent = this.byGUID[id];
        const node = (() => {
            const v = parent && parent[key];
            if (idx !== undefined) {
                return v[idx];
            }
            else {
                return v;
            }
        })();
        if (!node) {
            throw new Error("No such key(s) on that object during 'get'");
        }
        const setNode = action((n) => {
            const v = parent && parent[key];
            if (v) {
                if (idx !== undefined && v[idx]) {
                    v[idx] = n;
                    return;
                }
                else if (idx === undefined) {
                    parent[key] = n;
                    return;
                }
            }
            throw new Error("No such key(s) on that object");
        });
        const newGlobalObject = observable({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: node,
            metadata: {
                editor: {
                    guid: guid(),
                    pos: { ...pos }
                }
            }
        });
        const newHole = {
            exprKind: "@hole",
            metadata: {
                editor: {
                    guid: guid()
                }
            }
        };
        setNode(newHole);
        this.byGUID[newHole.metadata.editor.guid] = newHole;
        // Put the clone onto the globals stack
        this.byGUID[newGlobalObject.metadata.editor.guid] = newGlobalObject;
        this.program.globals.push(newGlobalObject);
        return newGlobalObject.metadata.editor.guid;
    }
    detachStatement(id, key, pos, idx) {
        const that = this;
        const parent = this.byGUID[id];
        const node = (() => {
            const v = parent && parent[key];
            if (idx !== undefined) {
                return v[idx];
            }
            else {
                return v;
            }
        })();
        if (!node) {
            throw new Error("No such key(s) on that object during 'get'");
        }
        const killNode = action(() => {
            const v = parent && parent[key];
            if (v) {
                if (idx !== undefined && v[idx]) {
                    const l = v;
                    if (l.length > 1) {
                        v.splice(idx, 1);
                    }
                    else {
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
                }
                else if (idx === undefined) {
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
            throw new Error("No such key(s) on that object");
        });
        const newGlobalObject = observable({
            globalKind: "_editor_detachedsyntax",
            syntaxKind: "statement",
            element: [node],
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
    register(g) {
        const id = this.loadGUID(g);
        this.updatePos(id, { x: 0, y: 0 });
        return g;
    }
    addGlobal(g) {
        this.program.globals.push(this.register(g));
    }
    dump() {
        console.log(toJS(this.program));
    }
    bump(idx) {
        if ((idx + 1) < this.program.globals.length) {
            const g = this.program.globals.splice(idx, 1);
            this.program.globals.push(g[0]);
        }
    }
    initMetadata(g) {
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
    updatePos(id, pos) {
        const glb = this.byGUID[id];
        if (glb) {
            this.metadataFor(glb).pos = pos;
        }
        else {
            console.warn("No such guid exists", guid, pos);
        }
    }
    metadataFor(node) {
        return node.metadata.editor;
    }
    loadGUID(node) {
        if (!node.metadata) {
            node.metadata = {
                editor: {
                    guid: guid(),
                }
            };
        }
        else if (!node.metadata.editor) {
            node.metadata.editor = {
                guid: guid(),
            };
        }
        this.byGUID[node.metadata.editor.guid] = node;
        return node.metadata.editor.guid;
    }
    loadGUIDTable() {
        this.byGUID = {};
        // TODO: This is going to be some technical debt
        // I want to traverse the AST and dynamically figure out which
        // nodes are SyntaxObjects based on their ownprops and recursively
        // loadguid on all of them.
        const that = this;
        function considerSyntaxObject(v) {
            if (typeof v === "object") {
                if (v.hasOwnProperty("exprKind") || v.hasOwnProperty("statementKind")) {
                    that.loadGUID(v);
                }
                Object.keys(v).filter((k) => (k !== "exprKind" && k !== "statementKind" && k !== "metadata")).forEach((k) => {
                    if (v.hasOwnProperty) {
                        considerSyntaxObject(v[k]);
                    }
                });
            }
        }
        // Bootstrap the process with the globals.
        this.program.globals.forEach((g) => {
            this.initMetadata(g);
            this.byGUID[this.loadGUID(g)] = g;
            considerSyntaxObject(g);
        });
    }
}
__decorate([
    observable
], ProjectStore.prototype, "program", void 0);
__decorate([
    computed
], ProjectStore.prototype, "canonicalProgram", null);
__decorate([
    action
], ProjectStore.prototype, "clear", null);
__decorate([
    action
], ProjectStore.prototype, "rmNode", null);
__decorate([
    action
], ProjectStore.prototype, "rmNodeByGUID", null);
__decorate([
    action
], ProjectStore.prototype, "reset", null);
__decorate([
    action
], ProjectStore.prototype, "insertInto", null);
__decorate([
    action
], ProjectStore.prototype, "detachExpression", null);
__decorate([
    action
], ProjectStore.prototype, "detachStatement", null);
__decorate([
    action
], ProjectStore.prototype, "register", null);
__decorate([
    action
], ProjectStore.prototype, "addGlobal", null);
__decorate([
    action
], ProjectStore.prototype, "bump", null);
__decorate([
    action
], ProjectStore.prototype, "initMetadata", null);
__decorate([
    action
], ProjectStore.prototype, "updatePos", null);
__decorate([
    action
], ProjectStore.prototype, "loadGUID", null);
export default new ProjectStore();
