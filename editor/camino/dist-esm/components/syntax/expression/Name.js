import { observer } from 'mobx-react';
import * as React from 'react';
import { useResizeParentEffect } from 'hooks/measure';
import Binder from '../../editor/Binder';
const Name = React.forwardRef((props, ref) => {
    useResizeParentEffect();
    return React.createElement(Binder, { ref: ref, bind: props.name, bindKey: "name" });
});
export default observer(Name);
