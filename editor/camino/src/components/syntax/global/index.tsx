import { observer } from 'mobx-react';
import * as React from 'react';

import * as surface from '@serendipity/syntax-surface';
import { matchGlobal } from '@serendipity/syntax-surface/dist/global';
import { useStores } from 'hooks/stores';
import { IEditorDetachedSyntax, IEditorGlobal } from 'stores/ProjectStore';
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

const Global = React.forwardRef<any, { global: IEditorGlobal }>((props, ref) => {

    const { ProjectStore } = useStores();

    function deleteNode() {
        ProjectStore.rmNodeByGUID(props.global.metadata.editor.guid);
    }

    const glb = props.global;
    const kind = glb.globalKind;

    if (kind === "_editor_detachedsyntax") {
        return <Detached ref={ref} onDelete={deleteNode} global={glb as IEditorDetachedSyntax} />;
    }

    const body = (() => {
        switch (kind) {
            case "main":
                return <Main onDelete={deleteNode} main={glb as surface.global.Main} />
            case "define":
                return <Define onDelete={deleteNode} define={glb as surface.global.Define} />
            case "definefunc":
                return <DefineFunc onDelete={deleteNode} definefunc={glb as surface.global.DefineFunction} />
            default:
                return (
                    <g ref={ref}>
                        <CloseButton onClick={deleteNode} />
                        <text style={{ fontFamily: 'monospace', fontWeight: 900 }} y={20} x={32} fill="white">{glb.globalKind} (unimplemented)</text>
                    </g>
                );
        }
    })();

    const guid = glb.metadata.editor.guid;

    return (
        <BoundingBox ref={ref}
            color={getColor(glb)}
            containerProps={{ id: guid }}>
            {body}
        </BoundingBox>
    );
})

export default observer(Global);