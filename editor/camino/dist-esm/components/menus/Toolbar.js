import { __decorate } from "tslib";
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import withStores from 'util/withStores';
import { Icon, Menu } from 'semantic-ui-react';
let Toolbar = class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.terminalButton = this.terminalButton.bind(this);
    }
    render() {
        const isTermOpen = this.props.PrefsStore.prefs.terminal;
        return (React.createElement("div", { style: {
                position: "absolute",
                width: "100%",
                left: 0,
                bottom: isTermOpen ? "30%" : 0
            } },
            React.createElement(Menu, { fluid: true, tabular: true, size: "mini", compact: true, inverted: true, color: "violet" },
                React.createElement(Menu.Item, { onClick: this.terminalButton, active: isTermOpen },
                    React.createElement(Icon, { name: "terminal" }),
                    "Terminal"))));
    }
    terminalButton() {
        this.props.PrefsStore.toggleTerminal();
    }
};
Toolbar = __decorate([
    inject('PrefsStore'),
    observer
], Toolbar);
export default withStores('PrefsStore')(Toolbar);
