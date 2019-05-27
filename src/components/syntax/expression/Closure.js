import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Expression from '.';
import SvgVertical from '../../layout/SvgVertical';
import SvgHorizontal from '../../layout/SvgHorizontal';
import Binder from '../../editor/Binder';
import AddButton from '../../editor/AddButton';
import Indent from '../../layout/Indent';
import { arrayEqual } from '../../../util';

@observer
class Closure extends Component {
    constructor(props) {
        super(props);
        this.addParam = this.addParam.bind(this);

        this.cachedParameters = null;
        this.cachedBinderLine = null;
    }

    renameParam(idx, name) {
        if (name === '') {
            this.props.closure.parameters.splice(idx, 1);
        } else {
            this.props.closure.parameters[idx] = name;
        }
    }

    addParam() {
        this.props.closure.parameters.push('new');
    }

    _getBinderLine() {
        if (!arrayEqual(this.cachedParameters, this.props.closure.parameters)) {
            // Update cache
            this.cachedParameters = [...this.props.closure.parameters];

            const binderLine = [<text>(</text>];
            this.props.closure.parameters.forEach((_, idx) => {
                binderLine.push(<Binder key={idx} bind={this.props.closure.parameters} bindKey={idx} />);
                if (idx + 1 !== this.props.closure.parameters.length) {
                    binderLine.push(<text key={"c_" + idx}>{", "}</text>);
                }
            });
            binderLine.push(<text>)</text>)
            binderLine.push(<AddButton onClick={this.addParam} />)
            binderLine.push(<text>=></text>)

            this.cachedBinderLine = binderLine;
        }
        return this.cachedBinderLine
    }

    render() {
        console.log("Closure is rendering.")
        return (
            <SvgVertical parent={this.props.parent} padding={20}>
                <SvgHorizontal padding={10} children={this._getBinderLine()} />
                <Indent x={36}>
                    <Expression expression={this.props.closure.body} />
                </Indent>
            </SvgVertical>
        );
    }
}

export default Closure;