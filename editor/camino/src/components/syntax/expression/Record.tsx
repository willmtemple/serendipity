import { Expression as SurfaceExpression, Record } from "@serendipity/syntax-surface";

import SvgFlex from "../../layout/SvgFlex";
import Indent from "../../layout/Indent";
import { syntax } from "../../../util/syntaxComponent";
import { AddButton, Binder } from "../../editor";
import { observable } from "mobx";
import { Project } from "@serendipity/editor-stores";
import Expression from ".";
import { SyntaxObject } from "@serendipity/syntax";

export default syntax<{ record: Record }>("Record", (props, ref) => {
  function addValue() {
    let name = "_";
    let idx = 0;

    while (Object.prototype.hasOwnProperty.call(props.record.data, name)) {
      idx += 1;
      name = `_${idx}`;
    }

    const hole: SurfaceExpression = { kind: "@hole" };

    Project.loadGUID(hole as any);

    props.record.data[name] = observable(hole);
  }

  const propsToIndex = Object.fromEntries(
    Object.entries(props.record.data).map(([name], idx) => [name, idx])
  );

  // This is such a terrible hack, but working around Draggable.ts is difficult.
  // The base of an expression binder needs to have a GUID in the project, so we
  // will just create a dummy object and add one here.
  const _expressionHelper = Object.defineProperties(
    {},
    Object.fromEntries(
      Object.keys(props.record.data).map((name) => [
        `data::${name}`,
        {
          get() {
            console.log("Getting record entry:", name);
            return props.record.data[name];
          },
          set(expr) {
            console.log("Setting record entry:", name, expr);
            props.record.data[name] = expr;
          },
        } as PropertyDescriptor,
      ])
    )
  );

  const guid = Project.loadGUID(_expressionHelper as SyntaxObject);

  const expressionHelper = observable(_expressionHelper);

  console.log("Rendering record:", guid);

  function createObjectBindHelper(name: string) {
    return {
      get propertyName(): string {
        return name;
      },
      set propertyName(newName: string) {
        const v = props.record.data[name]!;

        delete props.record.data[name];

        if (newName !== "") {
          props.record.data[newName] = v;
        } else if (v.kind !== "@hole") {
          Project.detachExpression(guid, "data", { x: 0, y: 0 }, propsToIndex[name]);
        }
      },
    };
  }

  return (
    <SvgFlex ref={ref} direction="vertical" padding={10}>
      <text>{"{"}</text>
      <Indent x={32}>
        <SvgFlex direction="vertical" padding={10}>
          {Object.entries(props.record.data).map(([name, _]) => (
            <SvgFlex key={name} direction="horizontal" align="middle" padding={12}>
              <Binder bind={createObjectBindHelper(name)} bindKey={"propertyName"} />
              <text>{"->"}</text>
              <Expression bind={expressionHelper} bindKey={`data::${name}`} />
            </SvgFlex>
          ))}
        </SvgFlex>
      </Indent>
      <SvgFlex direction="horizontal" align="middle" padding={10}>
        <text>{"}"}</text>
        <AddButton key="record_add_button" onClick={addValue} />
      </SvgFlex>
    </SvgFlex>
  );
});
