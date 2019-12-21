import { __decorate } from "tslib";
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Icon, Menu } from 'semantic-ui-react';
import withStores from 'util/withStores';
let Navbar = class Navbar extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement(Menu, { inverted: true, size: "massive", fixed: "top", color: "violet" },
            React.createElement(Menu.Item, { header: true }, "\u03BB \u00B7 Program Editor"),
            React.createElement(Menu.Menu, { position: "right" },
                React.createElement(Menu.Item, { icon: true, onClick: this.props.app.runProgram },
                    React.createElement(Icon, { name: "play", color: "green" })))));
    }
};
Navbar = __decorate([
    inject('ProjectStore'),
    observer
], Navbar);
export default withStores('ProjectStore')(Navbar);
