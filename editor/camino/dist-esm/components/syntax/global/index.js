import { observer } from 'mobx-react';
import * as React from 'react';
import { matchGlobal } from '@serendipity/syntax-surface/dist/global';
import { useStores } from 'hooks/stores';
import CloseButton from '../../editor/CloseButton';
import BoundingBox from '../../layout/BoundingBox';
import Define from './Define';
import DefineFunc from './DefineFunc';
import Detached from './Detached';
import Main from './Main';
function getColor(glb) {
    return matchGlobal({
        Define: () => "darkblue",
        DefineFunction: () => "darkviolet",
        Main: () => "maroon",
        // tslint:disable-next-line: object-literal-sort-keys
        Default: (_) => "black"
    })(glb);
}
const Global = React.forwardRef((props, ref) => {
    const { ProjectStore } = useStores();
    function deleteNode() {
        ProjectStore.rmNodeByGUID(props.global.metadata.editor.guid);
    }
    const glb = props.global;
    const kind = glb.globalKind;
    if (kind === "_editor_detachedsyntax") {
        return React.createElement(Detached, { ref: ref, onDelete: deleteNode, global: glb });
    }
    const body = (() => {
        switch (kind) {
            case "main":
                return React.createElement(Main, { onDelete: deleteNode, main: glb });
            case "define":
                return React.createElement(Define, { onDelete: deleteNode, define: glb });
            case "definefunc":
                return React.createElement(DefineFunc, { onDelete: deleteNode, definefunc: glb });
            default:
                return (React.createElement("g", { ref: ref },
                    React.createElement(CloseButton, { onClick: deleteNode }),
                    React.createElement("text", { style: { fontFamily: 'monospace', fontWeight: 900 }, y: 20, x: 32, fill: "white" },
                        glb.globalKind,
                        " (unimplemented)")));
        }
    })();
    const guid = glb.metadata.editor.guid;
    return (React.createElement(BoundingBox, { ref: ref, color: getColor(glb), containerProps: { id: guid } }, body));
});
export default observer(Global);
