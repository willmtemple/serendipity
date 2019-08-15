import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';

import './index.css';
import './vendor/semantic/dist/semantic.min.css';

import * as debug from './util/Debug';

import { StoreProvider } from './hooks/stores';

// The debug module exports a namespace on the window, so we declare it
//   globally here to be able to use it anywhere
declare global {
    // tslint:disable-next-line: interface-name
    interface Window { Debug: typeof debug }
}

window.Debug = debug;

const root = (
    <StoreProvider>
            <App />
    </StoreProvider>
)

ReactDOM.render(root, document.getElementById('root'));
