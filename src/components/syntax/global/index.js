import React, { Component } from 'react';
import Main from './Main';
import Define from './Define';
import DefineFunc from './DefineFunc';
import BoundingBox from '../../layout/BoundingBox';
import CloseButton from '../../editor/CloseButton';
import { inject, observer } from 'mobx-react';


function getColor(kind) {
    switch (kind) {
        case "main":
            return "maroon";
        case "define":
            return "darkblue";
        case "definefunc":
            return "darkviolet";
    }
}

@inject('ProjectStore')
@observer
class Global extends Component {
    constructor(props) {
        super(props);

        this.delete = this.delete.bind(this);
    }

    resize() {
        // This needs to be defined, but it doesn't do anything at the top level
    }

    delete() {
        this.props.ProjectStore.rmNodeByGUID(this.props.global.metadata.editor.guid)
    }

    render() {
        console.log("global is rendering")
        const body = (() => {
            switch (this.props.global.globalKind) {
                case "main":
                    return <Main onDelete={this.delete} main={this.props.global} />
                case "define":
                    return <Define onDelete={this.delete} define={this.props.global} />
                case "definefunc":
                    return <DefineFunc onDelete={this.delete} definefunc={this.props.global} />
                default:
                    return (
                        <g>
                            <CloseButton onClick={this.props.onDelete} />
                            <text style={{ fontFamily: 'monospace', fontWeight: 900 }} y={20} x={36} fill="white">{this.props.global.globalKind} (unimplemented)</text>
                        </g>
                    );
            }
        })();

        return (
            <BoundingBox
                parent={this}
                padding={10}
                color={getColor(this.props.global.globalKind)}
                stroke="black"
                strokeWidth={1.5}>
                {body}
            </BoundingBox>
        );
    }
}

export default Global;