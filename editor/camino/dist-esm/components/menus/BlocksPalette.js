import * as React from 'react';
import { Menu, Sidebar } from 'semantic-ui-react';
export default class BlocksPalette extends React.Component {
    render() {
        return (React.createElement("div", { className: "paletteMenu" },
            React.createElement(Sidebar, { as: Menu, visible: true, vertical: true, icon: true },
                React.createElement(Menu.Item, { icon: "desktop" }),
                React.createElement(Menu.Item, { icon: "desktop" }),
                React.createElement(Menu.Item, { icon: "desktop" }),
                React.createElement(Menu.Item, { icon: "desktop" }))));
    }
}
