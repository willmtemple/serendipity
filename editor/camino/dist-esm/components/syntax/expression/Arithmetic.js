import { observer } from 'mobx-react';
import * as React from 'react';
import SvgFlex from 'components/layout/SvgFlex';
import Expression from '.';
const Arithmetic = React.forwardRef((props, ref) => (React.createElement(SvgFlex, { ref: ref, direction: "horizontal", align: "middle", padding: 20 },
    React.createElement(Expression, { bind: props.arithmetic, bindKey: "left" }),
    React.createElement("text", null, props.arithmetic.op),
    React.createElement(Expression, { bind: props.arithmetic, bindKey: "right" }))));
export default observer(Arithmetic);
