import { Prefs, Project } from "@serendipity/editor-stores";

import { distance, Position } from "./Position";

import normalizeWheel from "normalize-wheel";
import { action } from "mobx";

// This module handles all of the dynamic drag operations using direct DOM
// manipulation. We have to be careful here not to piss off React,
// because we are directly and intentionally violating its design principles by
// adding classes and transforms here outside of the state-management that is
// internal to react.

// I have been very careful to only change things that I have not added as
// reactions in the components.

type BlockSourceFunction = (pos: Position) => string;
const registry: Map<symbol, BlockSourceFunction> = new Map();

export function registerSource(handler: BlockSourceFunction): symbol {
  const id = Symbol();
  registry.set(id, handler);

  return id;
}

export function unregister(id: symbol): void {
  registry.delete(id);
}

// This code is spaghett bad typescript
export function makeDraggable(svg: SVGSVGElement) {
  svg.addEventListener("mousedown", startDrag);
  svg.addEventListener("mousemove", drag);
  svg.addEventListener("mouseup", endDrag);
  svg.addEventListener("mouseleave", endDrag);

  svg.addEventListener("wheel", action(zoom));

  // Add a hook to resize events on the window that will adjust the
  // SVG viewBox to keep it at the correct size
  window.addEventListener("resize", resizeViewBox);

  const initialRect = svg.getClientRects()[0];
  const svgDims = {
    height: initialRect.height,
    left: Prefs.prefs.editorPosition.x,
    scale: Prefs.prefs.editorScale,
    top: Prefs.prefs.editorPosition.y,
    width: initialRect.width,
  };

  function resizeViewBox() {
    const rect = svg.getClientRects()[0];
    svgDims.width = rect.width;
    svgDims.height = rect.height;
    setViewBox();
  }

  let selectedElement: SVGGraphicsElement | undefined;
  let dragMode: "detach" | undefined;
  let dragStart: Position | undefined;
  let offset: { x: any; y: any };
  let transform: SVGTransform;
  let resume: string | undefined;
  let heldItemKind: "expression" | "statement" | undefined;
  const background: HTMLElement | null = document.getElementById("workspaceBackground");
  const svgBackground = (background as unknown) as SVGGraphicsElement;
  const bgTranslate = svg.createSVGTransform();
  svgBackground.transform.baseVal.insertItemBefore(bgTranslate, 0);

  function setViewBox() {
    const { left, top, width, height, scale } = svgDims;
    svg.setAttribute("viewBox", `${left} ${top} ${width * scale} ${height * scale}`);
    // Adjust for background scroll and 20% width margins
    // (should be width margin on both top and left, as DOM
    // calculates margins by element width)
    const bgLeft = left - width * 0.2;
    const bgTop = top - height * 0.2;
    bgTranslate.setTranslate(bgLeft - (bgLeft % 50), bgTop - (bgTop % 50));
  }
  resizeViewBox();

  function getMousePosition(evt: MouseEvent): Position {
    const ctm = svg.getScreenCTM() as DOMMatrix;
    return {
      x: (evt.clientX - ctm.e) / ctm.a,
      y: (evt.clientY - ctm.f) / ctm.d,
    };
  }

  function findDragRoot(e: Element) {
    let node: Element | null = e;
    while (
      node &&
      node !== svg &&
      !node.classList.contains("draggable") &&
      !node.classList.contains("button")
    ) {
      node = node.parentElement;
    }
    return node;
  }

  function startDrag(evt: MouseEvent) {
    if (evt.button !== 0) {
      return;
    }

    const t = evt.target as Element;
    const node = findDragRoot(evt.target as Element);

    if (node && node.classList.contains("button")) {
      return;
    }

    if (t.tagName !== "INPUT") {
      if (node === svg) {
        // Drag the background
        selectedElement = svg;
        offset = getMousePosition(evt);
      } else if (node && node.classList.contains("syntax")) {
        // We are dragging an expression out of its container
        selectedElement = node as SVGGraphicsElement;
        dragMode = "detach";
        dragStart = getMousePosition(evt);
      } else if (node) {
        selectedElement = node as SVGGraphicsElement;

        if (selectedElement.classList.contains("_editor_detachedsyntax")) {
          selectedElement.classList.add("nomouse");
          heldItemKind = selectedElement.getAttribute("data-port-compatibility") as any;
        }

        offset = getMousePosition(evt);

        const transforms = selectedElement.transform.baseVal;

        // numberOfItems ???????
        if (
          transforms.numberOfItems === 0 ||
          transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
        ) {
          const translate = svg.createSVGTransform();
          translate.setTranslate(0, 0);

          selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }

        transform = transforms.getItem(0);

        offset.x -= transform.matrix.e;
        offset.y -= transform.matrix.f;

        const dataIdx = selectedElement.getAttribute("data-idx");
        const idx = dataIdx && parseInt(dataIdx, 10);
        if (typeof idx === "number" && !isNaN(idx)) {
          Project.bump(idx);
        } else {
          console.warn("Selected global draggable does not have an index.");
        }
      }
    }
  }

  function drag(evt: MouseEvent) {
    // Resume the drag after a previous detach
    if (resume !== undefined) {
      const e = document.getElementById(resume);
      if (e != null) {
        selectedElement = (e as unknown) as SVGGraphicsElement;
        selectedElement.classList.add("nomouse");

        const transforms = selectedElement.transform.baseVal;

        // numberOfItems ???????
        if (
          transforms.numberOfItems === 0 ||
          transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
        ) {
          const translate = svg.createSVGTransform();
          translate.setTranslate(0, 0);

          selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }

        transform = transforms.getItem(0);

        offset.x -= transform.matrix.e;
        offset.y -= transform.matrix.f;
      }
      resume = undefined;
      return;
    }

    const mouse = getMousePosition(evt);
    if (selectedElement === svg) {
      evt.preventDefault();
      svgDims.left -= mouse.x - offset.x;
      svgDims.top -= mouse.y - offset.y;
      setViewBox();
    } else if (selectedElement && dragMode === "detach") {
      if (distance(dragStart!, getMousePosition(evt)) > 7) {
        const eltPos = selectedElement.getBoundingClientRect();

        const ctm = svg.getScreenCTM()!;
        const eltX = (eltPos.left - ctm.e) / ctm.a;
        const eltY = (eltPos.top - ctm.f) / ctm.d;

        const newPosition = {
          x: eltX + (mouse.x - dragStart!.x),
          y: eltY + (mouse.y - dragStart!.y),
        };

        if (selectedElement.classList.contains("source")) {
          // We need to run the registered handler
          const handlerId = (selectedElement as any)["data-ondetach"];
          const handler = registry.get(handlerId)!;
          dragMode = undefined;
          offset = {
            x: mouse.x,
            y: mouse.y,
          };
          heldItemKind = "expression";
          resume = handler(newPosition);
          drag(evt);
        } else {
          const guid = selectedElement.getAttribute("data-parent-guid");
          const key = selectedElement.getAttribute("data-mutation-key");
          const idx = selectedElement.getAttribute("data-mutation-idx") || undefined;

          if (guid && key) {
            let newGuid;
            if (selectedElement.classList.contains("expression")) {
              heldItemKind = "expression";
              newGuid = Project.detachExpression(
                guid,
                key,
                newPosition,
                idx ? parseInt(idx, 10) : undefined
              );
            } else {
              // statement
              heldItemKind = "statement";
              newGuid = Project.detachStatement(
                guid,
                key,
                newPosition,
                idx ? parseInt(idx, 10) : undefined
              );
            }
            dragMode = undefined;
            offset = {
              x: mouse.x,
              y: mouse.y,
            };
            resume = newGuid;
            drag(evt);
          } else {
            console.warn(
              "Tried to detach an element that is marked 'draggable expression' but did not have access info",
              selectedElement
            );
          }
        }
      }
    } else if (selectedElement) {
      evt.preventDefault();
      transform.setTranslate(mouse.x - offset.x, mouse.y - offset.y);
    }
  }

  function endDrag(evt: MouseEvent) {
    if (selectedElement === svg) {
      Prefs.setPosition(svgDims.left, svgDims.top);
    } else if (selectedElement) {
      const mouseOver = evt.target as SVGElement;
      const draggedGuid = selectedElement.getAttribute("data-guid");

      if (draggedGuid) {
        if (mouseOver && mouseOver.classList.contains("drop")) {
          // We are dropping an element into this target

          // If the element doesn't match the drop target, then don't drop it there
          if (heldItemKind && !mouseOver.classList.contains(heldItemKind)) {
            Project.updatePos(draggedGuid, {
              x: transform.matrix.e,
              y: transform.matrix.f,
            });
          } else {
            const overGuid = mouseOver.getAttribute("data-parent-guid");
            const overKey = mouseOver.getAttribute("data-mutation-key");
            const overIdxS = mouseOver.getAttribute("data-mutation-idx");

            if (overGuid != null && overKey != null) {
              const overIdx = overIdxS != null ? parseInt(overIdxS, 10) : undefined;

              Project.insertInto(draggedGuid, overGuid, overKey, overIdx);
            }
          }
        } else {
          Project.updatePos(draggedGuid, {
            x: transform.matrix.e,
            y: transform.matrix.f,
          });
        }
      }
      selectedElement.classList.remove("nomouse");
      dragMode = undefined;
      heldItemKind = undefined;
    }
    selectedElement = undefined;
  }

  function zoom(bEvt: WheelEvent) {
    const evt = normalizeWheel(bEvt);
    // Don't zoom while dragging anything.
    if (!selectedElement) {
      const oldScale = svgDims.scale;
      let nextScale = oldScale + evt.spinY / 10;
      nextScale = nextScale < 0.6 ? 0.6 : nextScale;
      nextScale = nextScale > 3.4 ? 3.4 : nextScale;

      const ratio = nextScale / oldScale;
      svgDims.scale = nextScale;
      Prefs.prefs.editorScale = nextScale;
      // Keep the mouse position fixed in SVG space
      const mouse = getMousePosition(bEvt);
      const { left, top } = svgDims;
      svgDims.left = mouse.x - (mouse.x - left) * ratio;
      svgDims.top = mouse.y - (mouse.y - top) * ratio;

      Prefs.setPosition(svgDims.left, svgDims.top);

      setViewBox();
    }
  }
}
