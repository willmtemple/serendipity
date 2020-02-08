import * as React from "react";

import { Provider } from "mobx-react";
import { DefaultPrefsStore } from "./stores/PrefsStore";
import { DefaultProjectStore } from "./stores/ProjectStore";

const stores = {
  Prefs: DefaultPrefsStore,
  Project: DefaultProjectStore
};

export type Stores = typeof stores;

const Context = React.createContext<Stores>(stores);

export const StoreProvider: React.FC = ({ children }) => {
  return (
    <Context.Provider value={stores}>
      <Provider {...stores}>{children}</Provider>
    </Context.Provider>
  );
};

export const useStores = () => {
  return React.useContext(Context);
};

