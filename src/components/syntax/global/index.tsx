import { inject, observer } from 'mobx-react';
import * as surface from 'proto-syntax/dist/lib/lang/syntax/surface';
import { matchGlobal } from 'proto-syntax/dist/lib/lang/syntax/surface/global';
import * as React from 'react';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import { IEditorDetachedSyntax, IEditorGlobal, ProjectStore } from 'src/stores/ProjectStore';
import withStores from 'src/util/withStores';
import CloseButton from '../../editor/CloseButton';
import BoundingBox from '../../layout/BoundingBox';
import Define from './Define';
import DefineFunc from './DefineFunc';
import Detached from './Detached';
import Main from './Main';


function getColor(glb: IEditorGlobal) {
    return matchGlobal({
        Define: () => "darkblue",
        DefineFunction: () => "darkviolet",
        Main: () => "maroon",
        // tslint:disable-next-line: object-literal-sort-keys
        Default: (_) => "black"
    })(glb as surface.global.Global)
}

interface IGlobalProps {
    ProjectStore: ProjectStore,
    global: IEditorGlobal
}

@inject('ProjectStore')
@observer
class Global extends React.Component<IGlobalProps>
    implements ISizedComponent {
    constructor(props: IGlobalProps) {
        super(props);

        this.delete = this.delete.bind(this);
    }

    public resize() {
        // This needs to be defined, but it doesn't do anything at the top level
    }

    public delete() {
        this.props.ProjectStore.rmNodeByGUID(this.props.global.metadata.editor.guid)
    }

    public render() {
        console.log("global is rendering")
        const glb = this.props.global;
        const kind = glb.globalKind;

        if (kind === "_editor_detachedsyntax") {
            return <Detached parent={this}
                        onDelete={this.delete}
                        global={glb as IEditorDetachedSyntax} />;
        }

        const body = (() => {
            switch (kind) {
                case "main":
                    return <Main onDelete={this.delete} main={glb as surface.global.Main} />
                case "define":
                    return <Define onDelete={this.delete} define={glb as surface.global.Define} />
                case "definefunc":
                    return <DefineFunc onDelete={this.delete} definefunc={glb as surface.global.DefineFunction} />
                default:
                    return (
                        <g>
                            <CloseButton onClick={this.delete} />
                            <text style={{ fontFamily: 'monospace', fontWeight: 900 }} y={20} x={36} fill="white">{this.props.global.globalKind} (unimplemented)</text>
                        </g>
                    );
            }
        })();

        const guid = this.props.ProjectStore.metadataFor(glb).guid;

        return (
            <BoundingBox
                parent={this}
                padding={10}
                color={getColor(glb)}
                stroke="black"
                strokeWidth={1.5}
                kind={kind}
                containerProps={{ id: guid }}>
                {body}
            </BoundingBox>
        );
    }
}

export default withStores('ProjectStore')(Global);