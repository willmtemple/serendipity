import { observer } from "mobx-react";
import * as React from "react";

import { match } from "omnimatch";

import * as expression from "@serendipity/syntax-surface";
import { useStores } from "@serendipity/editor-stores";

import ExpressionBlock from "../../layout/ExpressionBlock";
import SyntaxHole from "../../editor/ExpressionHole";

import Accessor from "./Accessor";
import Arithmetic from "./Arithmetic";
import Call from "./Call";
import Closure from "./Closure";
import Compare from "./Compare";
import If from "./If";
import List from "./List";
import Name from "./Name";
import Number from "./Number";
import Procedure from "./Procedure";
import Tuple from "./Tuple";
import Void from "./Void";
import With from "./With";
import { SyntaxObject } from "@serendipity/syntax";
import String from "./String";

export {
  Accessor,
  Arithmetic,
  Call,
  Closure,
  Compare,
  If,
  List,
  Name,
  Number,
  Procedure,
  Tuple,
  Void,
  With,
};

export interface ExpressionProps {
  bind: any;
  bindKey: string;
  bindIdx?: number;

  transform?: string;

  fixed?: boolean;
}

type CompleteProps = React.PropsWithChildren<ExpressionProps>;

function Expression(props: CompleteProps, ref: React.ForwardedRef<unknown>) {
  const { Project } = useStores();

  const expr = (props.bindIdx === undefined
    ? props.bind[props.bindKey]
    : props.bind[props.bindKey][props.bindIdx]) as expression.Expression;

  const kind = expr.kind;

  if (kind === "@hole") {
    return (
      <SyntaxHole
        ref={ref as any}
        transform={props.transform}
        bind={props.bind}
        bindKey={props.bindKey}
        bindIdx={props.bindIdx}
        kind="expression"
      />
    );
  }

  const body = match(expr, {
    If: (expr) => <If _if={expr} />,
    Void: () => <Void />,
    Tuple: (expr) => <Tuple tuple={expr} />,
    Number: (expr) => <Number number={expr} />,
    Closure: (expr) => <Closure closure={expr} />,
    Compare: (expr) => <Compare compare={expr} />,
    Name: (expr) => <Name name={expr} />,
    Arithmetic: (expr) => <Arithmetic arithmetic={expr} />,
    Call: (expr) => <Call call={expr} />,
    Accessor: (expr) => <Accessor accessor={expr} />,
    Procedure: (expr) => <Procedure procedure={expr} />,
    List: (expr) => <List list={expr} />,
    With: (expr) => <With with={expr} />,
    String: (expr) => <String string={expr} />,
  }) ?? (
    <text ref={ref as any} fill="white" fontFamily="Source Code Pro" fontWeight="600">
      {expr.kind} (unimplemented)
    </text>
  );

  // Set up node metadata for DOM access
  const containerProps: { [k: string]: any } = {};
  const guid = Project.metadataFor(expr as SyntaxObject).guid;
  containerProps.id = guid;
  containerProps.className =
    (props.fixed ? "" : "draggable ") + "syntax expression " + expr.kind.toLowerCase();
  containerProps["data-guid"] = Project.metadataFor(expr as SyntaxObject).guid;
  containerProps["data-parent-guid"] = Project.metadataFor(props.bind).guid;
  containerProps["data-mutation-key"] = props.bindKey;
  if (props.bindIdx !== undefined) {
    containerProps["data-mutation-idx"] = props.bindIdx;
  }

  return (
    <ExpressionBlock ref={ref} containerProps={containerProps} transform={props.transform}>
      {body}
    </ExpressionBlock>
  );
}

export default observer(React.forwardRef<unknown, CompleteProps>(Expression));
