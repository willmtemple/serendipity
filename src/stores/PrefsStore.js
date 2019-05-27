import { autorun, toJS, observable, action, set } from 'mobx';

const LOCAL_STORE_KEY = "userPrefs"

const defaultPrefs = {
    editorPosition: {
        x: 0,
        y: 0
    },
    editorScale: 1.0
};

class PrefsStore {
    constructor() {
        const that = this;
        const initialPrefs = Object.assign({}, defaultPrefs);
        const storedData = localStorage.getItem(LOCAL_STORE_KEY);
        if (storedData) {
            const prefs = JSON.parse(storedData);
            set(this.prefs, Object.assign(initialPrefs, prefs));
        } else {
            set(this.prefs, initialPrefs);
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

    @observable prefs = {};

    @action setPosition(x, y) {
        this.prefs.editorPosition.x = x;
        this.prefs.editorPosition.y = y;
    }

}

export default new PrefsStore();