import { action, autorun, observable, set, toJS } from "mobx";

const LOCAL_STORE_KEY = "userPrefs";

const defaultPrefs = {
  editorPosition: {
    x: 0,
    y: 0
  },
  editorScale: 1.0,
  terminal: false
};

export type ICheckedEvent<T extends Event, K> = {
  [P in keyof T]: T[P];
} & { type: K };

interface ICheckedEventTarget<T extends { [k: string]: Event }> {
  addEventListener<K extends keyof T>(name: K, h: (e: T[K]) => void): void;
  removeEventListener<K extends keyof T>(name: K, h: (e: T[K]) => void): void;
  dispatchEvent<K extends keyof T>(evt: ICheckedEvent<T[K], K>): void;
}

export class PrefsStore {
  @observable public prefs = defaultPrefs;

  public eventBus = new EventTarget() as ICheckedEventTarget<{
    data: CustomEvent<{ message: string }>;
  }>;

  constructor() {
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

  @action public setPosition(x: number, y: number) {
    this.prefs.editorPosition.x = x;
    this.prefs.editorPosition.y = y;
  }

  @action public toggleTerminal() {
    this.prefs.terminal = !this.prefs.terminal;
  }
}

export const DefaultPrefsStore = new PrefsStore();

