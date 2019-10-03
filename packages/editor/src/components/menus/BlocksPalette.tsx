import * as React from 'react';

import { Menu, Sidebar } from 'semantic-ui-react';

// tslint:disable-next-line: no-empty-interface
interface IBlocksPaletteProps { }

export default class BlocksPalette extends React.Component<IBlocksPaletteProps> {
    public render() {
        return (
            <div className="paletteMenu">
                <Sidebar as={Menu}
                        visible={true}
                        vertical={true}
                        icon={true}>
                    <Menu.Item icon="desktop" />
                    <Menu.Item icon="desktop" />
                    <Menu.Item icon="desktop" />
                    <Menu.Item icon="desktop" />
                </Sidebar>
            </div>
        );
    }
}