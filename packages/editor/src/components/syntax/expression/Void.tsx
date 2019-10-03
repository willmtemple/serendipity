import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';

const Void = React.forwardRef<SVGTextElement>((_, ref) => {
    useResizeParentEffect();

    return <text ref={ref}>void</text>
})

export default Void;