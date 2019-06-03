import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

import './index.css';
import './vendor/semantic/dist/semantic.min.css';

import 'xterm/dist/xterm.css';

import * as serviceWorker from './serviceWorker';

import {Provider} from 'mobx-react';
import prefsStore from './stores/PrefsStore';
import programStore from './stores/ProjectStore';

export const stores = {
    PrefsStore: prefsStore,
    ProjectStore: programStore
}

const root = (
    <Provider {...stores}>
        <App />
    </Provider>
)

ReactDOM.render(root, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
