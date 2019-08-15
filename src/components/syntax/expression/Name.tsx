import { observer } from 'mobx-react';
import * as React from 'react';

import { Name } from 'proto-syntax/dist/lib/lang/syntax/surface/expression';
import { useResizeParentEffect } from 'src/hooks/measure';
import Binder from '../../editor/Binder';

const Name = React.forwardRef<any, { name: Name }> ((props, ref) => {
    useResizeParentEffect();

    return <Binder ref={ref} bind={props.name} bindKey="name" />;
})

export default observer(Name);