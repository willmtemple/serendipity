import { observer } from 'mobx-react';
import * as React from 'react';

import { SyntaxObject } from 'proto-syntax/dist/lib/lang/syntax';

import { useResizeParentEffect } from 'src/hooks/measure';
import { useStores } from 'src/hooks/stores';

interface ISyntaxHoleProps {
    bind: SyntaxObject,
    bindKey: string | number,
    bindIdx?: number,

    kind: "expression" | "statement",
}

const SyntaxHole = React.forwardRef<SVGRectElement, ISyntaxHoleProps>((props, ref) => {
    const { ProjectStore } = useStores();

    useResizeParentEffect();

    return (
        <rect ref={ref}
            className={"drop " + props.kind}
            data-parent-guid={ProjectStore.metadataFor(props.bind).guid}
            data-mutation-key={props.bindKey}
            data-mutation-idx={props.bindIdx}
            fill="#FFFFFFE0"
            rx={5}
            width={90}
            height={48} />
    )
})

export default observer(SyntaxHole);