import React, { useEffect } from "react";

import { observer } from "mobx-react";

import { ExpressionBlock } from "../layout";
import { BinderProps } from "./Binder";
import { Binder } from ".";
import { registerSource, unregister } from "../../util/Draggable";
import { Project } from "@serendipity/editor-stores";
import { Position } from "../../util/Position";

interface NameSourceProps {
  binderProps: BinderProps & { bindIdx?: undefined };

  transform?: string;
}

function NameSource(props: NameSourceProps, ref: React.ForwardedRef<unknown>) {
  const value = props.binderProps.bind[props.binderProps.bindKey] as string;

  const containerProps = {
    className: "draggable syntax name expression source",
  };

  useEffect(() => {
    if ((ref as React.MutableRefObject<SVGGElement>).current) {
      const id = registerSource((pos: Position) =>
        Project.addGlobal(
          {
            kind: "_editor_detachedsyntax",
            syntaxKind: "expression",
            element: {
              kind: "Name",
              name: props.binderProps.bind[props.binderProps.bindKey],
            },
          },
          pos
        )
      );

      (ref as any).current["data-ondetach"] = id;

      return () => {
        unregister(id);
      };
    }
  });

  return value === "" || value.startsWith("_") ? (
    <Binder
      ref={ref as React.ForwardedRef<SVGForeignObjectElement>}
      {...props.binderProps}
      transform={props.transform}
    />
  ) : (
    <ExpressionBlock ref={ref} containerProps={containerProps} transform={props.transform}>
      <Binder {...props.binderProps} />
    </ExpressionBlock>
  );
}

export default observer(React.forwardRef(NameSource));
