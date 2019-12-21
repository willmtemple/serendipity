import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
import Indent from '../../layout/Indent';
const Tuple = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "vertical", padding: 10 },
    React.createElement("text", null, "("),
    React.createElement(Indent, { x: 32 },
        React.createElement(SvgFlex, { direction: "vertical", padding: 20 }, props.tuple.values.map((_, idx) => React.createElement(Expression, { key: idx, bind: props.tuple, bindKey: "values", bindIdx: idx })))),
    React.createElement("text", null, ")"))));
export default observer(Tuple);
