import * as React from 'react';
import { Provider } from 'mobx-react';
import PrefsStore from 'stores/PrefsStore';
import ProjectStore from 'stores/ProjectStore';
// Our stores. These can all be recovered from the context below.
// TODO: once everything
export const stores = {
    PrefsStore,
    ProjectStore
};
const Context = React.createContext(stores);
export const StoreProvider = ({ children }) => {
    return (React.createElement(Context.Provider, { value: stores },
        React.createElement(Provider, Object.assign({}, stores), children)));
};
export const useStores = () => {
    return React.useContext(Context);
};
