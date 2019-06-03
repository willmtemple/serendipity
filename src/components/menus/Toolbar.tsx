import { inject, observer } from 'mobx-react';
import * as React from 'react';
import withStores from 'src/util/withStores';

import { PrefsStore } from 'src/stores/PrefsStore';

import { Icon, Menu } from 'semantic-ui-react';
import { App } from 'src/App';

interface IToolbarProps {
    app: App

    // Injected
    PrefsStore: PrefsStore
}

@inject('PrefsStore')
@observer
class Toolbar extends React.Component<IToolbarProps> {
    constructor(props: IToolbarProps) {
        super(props);

        this.terminalButton = this.terminalButton.bind(this);
    }

    public render() {
        const isTermOpen = this.props.PrefsStore.prefs.terminal;
        return (
            <div style={{
                position: "absolute",
                width: "100%",
                left: 0,
                bottom: isTermOpen ? "30%" : 0
            }}>
                <Menu
                    fluid={true}
                    tabular={true}
                    size="mini"
                    compact={true}
                    inverted={true}
                    color="violet">
                    <Menu.Item  onClick={this.terminalButton}
                                active={isTermOpen}>
                        <Icon name="terminal" />
                        Terminal
                    </Menu.Item>
                </Menu>
            </div>
        );
    }

    private terminalButton() {
        this.props.PrefsStore.toggleTerminal();
    }
}

export default withStores('PrefsStore')(Toolbar);