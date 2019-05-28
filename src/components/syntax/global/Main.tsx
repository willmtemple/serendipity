import { observer } from 'mobx-react';
import * as React from 'react';

import { global } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import CloseButton from '../../editor/CloseButton';
import Expression from '../expression';

interface IMainProps {
    parent?: ISizedComponent,
    main: global.Main
    onDelete() : void,
}

@observer
class Main extends React.Component<IMainProps> {
    public render() {
        return (
            <g>
                <CloseButton onClick={this.props.onDelete} />
                <text x={30} fontWeight={900}>when the program starts, do</text>
                <g className="exprBox" transform="translate(30, 30)">
                    <Expression parent={this.props.parent} expression={this.props.main.body} />
                </g>
            </g>
        );
    }
}

export default Main;