import { __decorate } from "tslib";
import { action, autorun, observable, set, toJS } from 'mobx';
const LOCAL_STORE_KEY = "userPrefs";
const defaultPrefs = {
    editorPosition: {
        x: 0,
        y: 0
    },
    editorScale: 1.0,
    terminal: false
};
export class PrefsStore {
    constructor() {
        this.prefs = defaultPrefs;
        this.eventBus = new EventTarget();
        const that = this;
        const storedData = localStorage.getItem(LOCAL_STORE_KEY);
        if (storedData) {
            const storedPrefs = JSON.parse(storedData);
            set(this.prefs, { ...defaultPrefs, ...storedPrefs });
        }
        let firstRun = true;
        autorun(() => {
            const json = JSON.stringify(toJS(that.prefs));
            if (!firstRun) {
                localStorage.setItem(LOCAL_STORE_KEY, json);
            }
            firstRun = false;
        });
    }
    setPosition(x, y) {
        this.prefs.editorPosition.x = x;
        this.prefs.editorPosition.y = y;
    }
    toggleTerminal() {
        this.prefs.terminal = !this.prefs.terminal;
    }
}
__decorate([
    observable
], PrefsStore.prototype, "prefs", void 0);
__decorate([
    action
], PrefsStore.prototype, "setPosition", null);
__decorate([
    action
], PrefsStore.prototype, "toggleTerminal", null);
export default new PrefsStore();
