import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';
const Void = React.forwardRef((_, ref) => {
    useResizeParentEffect();
    return React.createElement("text", { ref: ref }, "void");
});
export default Void;
