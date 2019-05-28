import { action, autorun, observable, set, toJS } from 'mobx';

const LOCAL_STORE_KEY = "userPrefs"

const defaultPrefs = {
    editorPosition: {
        x: 0,
        y: 0
    },
    editorScale: 1.0
};

class PrefsStore {
    @observable public prefs = defaultPrefs;

    constructor() {
        const that = this;
        const storedData = localStorage.getItem(LOCAL_STORE_KEY);
        if (storedData) {
            const storedPrefs = JSON.parse(storedData);
            set(this.prefs, Object.assign(this.prefs, storedPrefs));
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

    @action public setPosition(x : number, y : number) {
        this.prefs.editorPosition.x = x;
        this.prefs.editorPosition.y = y;
    }

}

export default new PrefsStore();