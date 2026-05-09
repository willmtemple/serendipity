import { autorun, makeAutoObservable, set, toJS } from "mobx";

import type { Module } from "@serendipity/parser";

const LOCAL_STORE_KEY = "userPrefs";

const defaultPrefs = {
  editorPosition: {
    x: 0,
    y: 0
  },
  editorScale: 1.0,
  outputPanel: false
};

export type CheckedEvent<T extends Event, K> = {
  [P in keyof T]: T[P];
} & { type: K };

interface CheckedEventTarget<T extends { [k: string]: Event }> {
  addEventListener<K extends keyof T>(name: K, h: (e: T[K]) => void): void;
  removeEventListener<K extends keyof T>(name: K, h: (e: T[K]) => void): void;
  dispatchEvent<K extends keyof T>(evt: CheckedEvent<T[K], K>): void;
}

export class PrefsStore {
  public prefs = defaultPrefs;

  public eventBus = new EventTarget() as CheckedEventTarget<{
    data: CustomEvent<{ level?: "info" | "success" | "error"; message: string }>;
    runProgram: CustomEvent<{ program: Module }>;
    toast: CustomEvent<{ level: "info" | "success" | "error"; message: string }>;
  }>;

  constructor() {
    makeAutoObservable(this);
    const storedData = localStorage.getItem(LOCAL_STORE_KEY);
    if (storedData) {
      const storedPrefs = JSON.parse(storedData);
      set(this.prefs, { ...defaultPrefs, ...storedPrefs });
    }

    let firstRun = true;
    autorun(() => {
      const json = JSON.stringify(toJS(this.prefs));
      if (!firstRun) {
        localStorage.setItem(LOCAL_STORE_KEY, json);
      }
      firstRun = false;
    });
  }

  public setPosition(x: number, y: number) {
    this.prefs.editorPosition.x = x;
    this.prefs.editorPosition.y = y;
  }

  public setOutputPanel(open: boolean) {
    this.prefs.outputPanel = open;
  }

  public toggleOutputPanel() {
    this.prefs.outputPanel = !this.prefs.outputPanel;
  }

  get isOutputPanelOpen() {
    return this.prefs.outputPanel;
  }
}

export const DefaultPrefsStore = new PrefsStore();
