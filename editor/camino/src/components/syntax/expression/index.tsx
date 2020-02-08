import { observer } from "mobx-react";
import * as React from "react";

import * as expression from "@serendipity/syntax-surface/dist/expression";

import ExpressionBlock from "../../layout/ExpressionBlock";
import SyntaxHole from "../../editor/ExpressionHole";

import { useStores } from "../../../hooks/stores";
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
  With
};

function getColor(kind: string) {
  switch (kind) {
    case "if":
      return "mediumvioletred";
    case "void":
      return "black";
    case "tuple":
      return "green";
    case "number":
      return "red";
    case "list":
      return "darkgreen";
    case "name":
      return "darkorange";
    case "closure":
      return "purple";
    case "compare":
      return "darkcyan";
    case "arithmetic":
      return "midnightblue";
    case "accessor":
      return "darkslategrey";
    case "call":
      return "blueviolet";
    case "procedure":
      return "firebrick";
    case "with":
      return "palevioletred";
    default:
      return "black";
  }
}

export interface IExpressionProps {
  bind: any;
  bindKey: string;
  bindIdx?: number;

  fixed?: boolean;
}

type CompleteProps = React.PropsWithChildren<IExpressionProps>;

const Expression = React.forwardRef<any, CompleteProps>((props, ref) => {
  const { ProjectStore } = useStores();

  const expr = (props.bindIdx === undefined
    ? props.bind[props.bindKey]
    : props.bind[props.bindKey][props.bindIdx]) as expression.Expression;

  const kind = expr.exprKind;

  if (kind === "@hole") {
    return (
      <SyntaxHole
        ref={ref}
        bind={props.bind}
        bindKey={props.bindKey}
        bindIdx={props.bindIdx}
        kind="expression"
      />
    );
  }

  const body = (() => {
    switch (kind) {
      case "if":
        return <If _if={expr as expression.If} />;
      case "void":
        return <Void />;
      case "tuple":
        return <Tuple tuple={expr as expression.Tuple} />;
      case "number":
        return <Number number={expr as expression.Number} />;
      case "closure":
        return <Closure closure={expr as expression.Closure} />;
      case "compare":
        return <Compare compare={expr as expression.Compare} />;
      case "name":
        return <Name name={expr as expression.Name} />;
      case "arithmetic":
        return <Arithmetic arithmetic={expr as expression.Arithmetic} />;
      case "call":
        return <Call call={expr as expression.Call} />;
      case "accessor":
        return <Accessor accessor={expr as expression.Accessor} />;
      case "procedure":
        return <Procedure procedure={expr as expression.Procedure} />;
      case "list":
        return <List list={expr as expression.List} />;
      case "with":
        return <With with={expr as expression.With} />;
      default:
        return (
          <text ref={ref} fill="white" fontFamily="Source Code Pro" fontWeight="600">
            {expr.exprKind} (unimplemented)
          </text>
        );
    }
  })();

  // Set up node metadata for DOM access
  const containerProps: { [k: string]: any } = {};
  const guid = ProjectStore.metadataFor(expr).guid;
  containerProps.id = guid;
  containerProps.className = props.fixed ? "expression" : "draggable syntax expression";
  containerProps["data-guid"] = ProjectStore.metadataFor(expr).guid;
  containerProps["data-parent-guid"] = ProjectStore.metadataFor(props.bind).guid;
  containerProps["data-mutation-key"] = props.bindKey;
  if (props.bindIdx !== undefined) {
    containerProps["data-mutation-idx"] = props.bindIdx;
  }

  return (
    <ExpressionBlock ref={ref} color={getColor(kind)} containerProps={containerProps}>
      {body}
    </ExpressionBlock>
  );
});

export default observer(Expression);
