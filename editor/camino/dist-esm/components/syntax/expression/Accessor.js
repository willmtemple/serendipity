import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
const Accessor = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "horizontal", align: "end", padding: 20 },
    React.createElement(Expression, { bind: props.accessor, bindKey: "accessee" }),
    React.createElement("text", null, "."),
    React.createElement(Expression, { bind: props.accessor, bindKey: "index" }))));
export default observer(Accessor);
