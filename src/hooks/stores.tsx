import * as React from 'react';

import { Provider } from 'mobx-react';
import PrefsStore from 'src/stores/PrefsStore';
import ProjectStore from 'src/stores/ProjectStore';

// Our stores. These can all be recovered from the context below.
// TODO: once everything
export const stores = {
    PrefsStore,
    ProjectStore
}

const Context = React.createContext<typeof stores>(stores);

export const StoreProvider: React.FC = ({children}) => {
    return (
        <Context.Provider value={stores}>
            <Provider {... stores}>
                {children}
            </Provider>
        </Context.Provider>
    )
}

export const useStores = () => {
    return React.useContext(Context);
}