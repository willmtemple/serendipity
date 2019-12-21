import { observer } from 'mobx-react';
import * as React from 'react';
import Indent from 'components/layout/Indent';
import SvgFlex from 'components/layout/SvgFlex';
import { useStores } from 'hooks/stores';
import Statement from '../statement';
const Procedure = React.forwardRef((props, ref) => {
    const { ProjectStore } = useStores();
    return React.createElement("g", { ref: ref },
        React.createElement("text", null, "<proc>"),
        React.createElement(Indent, { x: 12, y: 32 },
            React.createElement(SvgFlex, { direction: "vertical", padding: -10 }, props.procedure.body.map((s, idx) => React.createElement(Statement, { key: ProjectStore.metadataFor(s).guid, bind: props.procedure, bindKey: "body", bindIdx: idx })))));
});
export default observer(Procedure);
