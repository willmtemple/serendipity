import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './vendor/semantic/dist/semantic.min.css';
import * as debug from './util/Debug';
import { StoreProvider } from './hooks/stores';
window.Debug = debug;
const root = (React.createElement(StoreProvider, null,
    React.createElement(App, null)));
ReactDOM.render(root, document.getElementById('root'));
