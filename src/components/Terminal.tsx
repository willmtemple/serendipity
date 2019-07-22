import { inject } from 'mobx-react';
import * as React from 'react';

import { PrefsStore } from 'src/stores/PrefsStore';
import withStores from 'src/util/withStores';

import { Terminal as XTerm } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

import 'xterm/dist/xterm.css';

interface ITermDetailedProps {
    termDivProps: TermDivProps

    // injected
    PrefsStore: PrefsStore
}

type TermDivProps = React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement>;

@inject('PrefsStore')
class Terminal extends React.Component<ITermDetailedProps> {
    private termRef : React.RefObject<HTMLDivElement> = React.createRef();
    private term : XTerm;

    constructor(props: ITermDetailedProps) {
        super(props);

        this.term = new XTerm({
            fontFamily: "Source Code Pro",
            fontWeight: "600"
        });

        this.handleEvent = this.handleEvent.bind(this);
    }

    public componentDidMount() {
        const tElt = this.termRef.current;
        if (!tElt) {
            console.error("Terminal mounted, but the child div is not available");
            return;
        }

        this.term.open(tElt);
        fit.fit(this.term);

        this.term.writeln('Program Terminal');
        this.term.writeln('');

        this.props.PrefsStore.eventBus.addEventListener(
            'data',
            this.handleEvent
        );
    }

    public componentWillUnmount() {
        this.props.PrefsStore.eventBus.removeEventListener(
            'data',
            this.handleEvent
        )
    }

    public render() {
        return (
            <div ref={this.termRef} {...this.props.termDivProps} />
        );
    }

    private handleEvent(e : CustomEvent) {
        this.term.write(e.detail.message);
    }
}

export default withStores('PrefsStore')(Terminal);