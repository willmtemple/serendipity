import * as React from "react";

import { observer } from "mobx-react";

import { EditorDetachedSyntax, EditorDetachedStatements } from "@serendipity/editor-stores";

import Expression from "../expression";
import Statement from "../statement";
import { SvgFlex } from "../../layout";

interface DetachedProps {
  global: EditorDetachedSyntax;

  onDelete(): void;
}

const Detached = React.forwardRef<SVGGElement, DetachedProps>((props, ref) => {
  const kind = props.global.syntaxKind;

  const body = (() => {
    switch (kind) {
      case "expression":
        return <Expression fixed={true} bind={props.global} bindKey="element" />;
      case "statement":
        return (
          <SvgFlex direction="vertical" padding={-10}>
            {(props.global as EditorDetachedStatements).element.map((_, idx) => (
              <Statement fixed={idx === 0} bind={props.global} bindKey="element" bindIdx={idx} />
            ))}
          </SvgFlex>
        );
      default:
        const _exhaust: never = kind;
        return _exhaust;
    }
  })();

  return (
    <g ref={ref} filter="url(#detachedElement)" opacity="0.8">
      {body}
    </g>
  );
});

export default observer(Detached);

