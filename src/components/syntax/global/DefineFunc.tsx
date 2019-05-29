import { observer } from 'mobx-react';
import * as React from 'react';

import { global } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import { arrayEqual } from '../../../util';
import AddButton from '../../editor/AddButton';
import Binder from '../../editor/Binder';
import CloseButton from '../../editor/CloseButton';
import Expression from '../expression';

interface IDefineFuncProps {
    parent?: ISizedComponent,
    definefunc: global.DefineFunction,

    onDelete() : void
}

@observer
class DefineFunc extends React.Component<IDefineFuncProps> {
    private cachedParameters : string[] | null;
    private cachedBinderLine : JSX.Element[] | null;
    constructor(props : IDefineFuncProps) {
        super(props);

        this.cachedParameters = null;
        this.cachedBinderLine = null;

        this.addParam = this.addParam.bind(this);
    }

    public render() {
        console.log("DefineFunc is rendering");
        return (
            <g>
                <SvgFlex direction="horizontal" parent={this.props.parent} padding={10}>
                    {this._getBinderLine()}
                </SvgFlex>
                <g className="exprBox" transform="translate(30, 60)">
                    <Expression parent={this.props.parent} bind={this.props.definefunc} bindKey="body" />
                </g>
            </g>
        );
    }

    private _getBinderLine() {
        if (!arrayEqual(this.cachedParameters, this.props.definefunc.parameters)) {
            // Update cache
            this.cachedParameters = [...this.props.definefunc.parameters];

            const binderLine = [
                <CloseButton key="df_close" onClick={this.props.onDelete} />,
                <text key="df_label">define</text>,
                <Binder key="df_name" bind={this.props.definefunc} bindKey="name" />,
                <text key="df_open_paren">(</text>
            ];

            this.props.definefunc.parameters.forEach((_, idx) => {
                binderLine.push(<Binder key={idx} bind={this.props.definefunc.parameters} bindKey={idx} />);
                if (idx + 1 !== this.props.definefunc.parameters.length) {
                    binderLine.push(<text key={"df_comma_" + idx}>, </text>);
                }
            });
            binderLine.push(<text key="df_close_paren">)</text>)
            binderLine.push(<AddButton key="df_expand" onClick={this.addParam} />)
            binderLine.push(<text key="df_arrow">=></text>)

            this.cachedBinderLine = binderLine;
        }
        return this.cachedBinderLine
    }

    private addParam() {
        this.props.definefunc.parameters.push('new');
    }
}

export default DefineFunc;