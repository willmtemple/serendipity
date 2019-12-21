import * as React from 'react';
const Indent = React.forwardRef((props, ref) => (React.createElement("g", { ref: ref },
    React.createElement("g", { transform: `translate(${props.x || 0}, ${props.y || 0})` }, props.children))));
export default Indent;
