import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(React.createElement(App, null), div);
    ReactDOM.unmountComponentAtNode(div);
});
