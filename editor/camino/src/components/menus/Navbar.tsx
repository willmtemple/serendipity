import { inject, observer } from 'mobx-react';
import * as React from 'react';

import { Icon, Menu } from 'semantic-ui-react';

import { App } from 'App';
import { ProjectStore } from 'stores/ProjectStore';
import withStores from 'util/withStores';

interface INavbarProps {
    app: App
    ProjectStore: ProjectStore
}

@inject('ProjectStore')
@observer
class Navbar extends React.Component<INavbarProps> {
    constructor(props: INavbarProps) {
        super(props);
    }

    public render() {
        return (
            <Menu   inverted={true}
                    size="massive"
                    fixed="top"
                    color="violet">
                <Menu.Item header={true}>λ &middot; Program Editor</Menu.Item>
                <Menu.Menu position="right">
                    <Menu.Item icon={true} onClick={this.props.app.runProgram}>
                        <Icon name="play" color="green" />
                    </Menu.Item>
                </Menu.Menu>
            </Menu>
        );
    }
}

export default withStores('ProjectStore')(Navbar);