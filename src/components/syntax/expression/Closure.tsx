import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Expression from '.';
import { arrayEqual } from '../../../util';
import AddButton from '../../editor/AddButton';
import Binder from '../../editor/Binder';
import Indent from '../../layout/Indent';

interface IClosureProps {
    parent? : ISizedComponent,

    closure: expression.Closure
}

@observer
class Closure extends React.Component<IClosureProps> {
    private cachedParameters : string[] | null;
    private cachedBinderLine : JSX.Element[] | null;

    constructor(props : IClosureProps) {
        super(props);
        this.addParam = this.addParam.bind(this);

        this.cachedParameters = null;
        this.cachedBinderLine = null;
    }

    public render() {
        console.log("Closure is rendering.")
        return (
            <SvgFlex direction="vertical" parent={this.props.parent} padding={20}>
                <SvgFlex direction="horizontal" padding={10} children={this._getBinderLine()} />
                <Indent x={36}>
                    <Expression expression={this.props.closure.body} />
                </Indent>
            </SvgFlex>
        );
    }

    private addParam() {
        this.props.closure.parameters.push('new');
    }

    private _getBinderLine() {
        if (!arrayEqual(this.cachedParameters, this.props.closure.parameters)) {
            // Update cache
            this.cachedParameters = [...this.props.closure.parameters];

            const binderLine = [<text key="clos_open_paren">(</text>];
            this.props.closure.parameters.forEach((_, idx) => {
                binderLine.push(<Binder key={"clos_param_" + idx} bind={this.props.closure.parameters} bindKey={idx} />);
                if (idx + 1 !== this.props.closure.parameters.length) {
                    binderLine.push(<text key={"clos_comma_" + idx}>{", "}</text>);
                }
            });
            binderLine.push(<text key={"clos_close_paren"}>)</text>)
            binderLine.push(<AddButton key="clos_add" onClick={this.addParam} />)
            binderLine.push(<text key="clos_arrow">=></text>)

            this.cachedBinderLine = binderLine;
        }
        return this.cachedBinderLine
    }
}

export default Closure;