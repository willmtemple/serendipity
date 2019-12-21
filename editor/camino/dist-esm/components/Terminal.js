import { __decorate } from "tslib";
import { inject } from 'mobx-react';
import * as React from 'react';
import withStores from 'util/withStores';
import { Terminal as XTerm } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import 'xterm/dist/xterm.css';
let Terminal = class Terminal extends React.Component {
    constructor(props) {
        super(props);
        this.termRef = React.createRef();
        this.term = new XTerm({
            fontFamily: "Source Code Pro",
            fontWeight: "600"
        });
        this.handleEvent = this.handleEvent.bind(this);
    }
    componentDidMount() {
        const tElt = this.termRef.current;
        if (!tElt) {
            console.error("Terminal mounted, but the child div is not available");
            return;
        }
        this.term.open(tElt);
        fit.fit(this.term);
        this.term.writeln('Program Terminal');
        this.term.writeln('');
        this.props.PrefsStore.eventBus.addEventListener('data', this.handleEvent);
    }
    componentWillUnmount() {
        this.props.PrefsStore.eventBus.removeEventListener('data', this.handleEvent);
    }
    render() {
        return (React.createElement("div", Object.assign({ ref: this.termRef }, this.props.termDivProps)));
    }
    handleEvent(evt) {
        this.term.write(evt.detail.message);
    }
};
Terminal = __decorate([
    inject('PrefsStore')
], Terminal);
export default withStores('PrefsStore')(Terminal);
