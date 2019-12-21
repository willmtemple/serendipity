import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
const Compare = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "horizontal", align: "middle", padding: 20 },
    React.createElement(Expression, { bind: props.compare, bindKey: "left" }),
    React.createElement("text", null, props.compare.op),
    React.createElement(Expression, { bind: props.compare, bindKey: "right" }))));
export default observer(Compare);
