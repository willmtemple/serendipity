import * as React from "react";

import { useStores } from "@serendipity/editor-stores";

import { InsertContext, InsertContextKind } from "./components/editor/InsertDrawer";

interface SyntaxTarget {
  guid: string;
  parentGuid?: string;
  key?: string;
  idx?: number;
  kind: InsertContextKind;
}

interface AttachedSyntaxTarget extends SyntaxTarget {
  parentGuid: string;
  key: string;
  kind: "expression" | "statement";
}

interface DragSnapTarget {
  kind: "expression" | "statement";
  parentGuid: string;
  key: string;
  idx?: number;
}

export interface WorkspacePosition {
  x: number;
  y: number;
}

function parseOptionalIndex(value: string | null): number | undefined {
  if (value === null) return undefined;
  const idx = parseInt(value, 10);
  return Number.isInteger(idx) ? idx : undefined;
}

function cssEscape(value: string): string {
  return typeof CSS === "undefined" ? value.replace(/["\\]/g, "\\$&") : CSS.escape(value);
}

const SYNTAX_SELECTOR = ".syntax.expression[data-guid], .syntax.statement[data-guid]";

export function useWorkspaceInteraction() {
  const pointerStart = React.useRef<{ x: number; y: number } | null>(null);
  const detachedDrag = React.useRef<{
    guid: string;
    kind: "expression" | "statement";
    offset: WorkspacePosition;
    pos: WorkspacePosition;
    snap: DragSnapTarget | null;
  } | null>(null);
  const attachedDrag = React.useRef<{
    element: SVGGraphicsElement;
    target: AttachedSyntaxTarget;
    start: WorkspacePosition;
  } | null>(null);
  const globalDrag = React.useRef<{
    guid: string;
    offset: WorkspacePosition;
    pos: WorkspacePosition;
  } | null>(null);
  const hoveredGuidRef = React.useRef<string | null>(null);
  const [insertContext, setInsertContext] = React.useState<InsertContext | null>(null);
  const [hoveredGuid, setHoveredGuid] = React.useState<string | null>(null);
  const [snapTarget, setSnapTarget] = React.useState<DragSnapTarget | null>(null);
  const [selected, setSelected] = React.useState<SyntaxTarget | null>(null);
  const [dragPositions, setDragPositions] = React.useState<Record<string, WorkspacePosition>>({});
  const dragPositionsRef = React.useRef<Record<string, WorkspacePosition>>({});
  const pendingDragPosition = React.useRef<{ guid: string; pos: WorkspacePosition } | null>(null);
  const dragFrame = React.useRef<number | null>(null);
  const { Project } = useStores();

  React.useEffect(() => {
    return () => {
      if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current);
    };
  }, []);

  const interactionState = React.useMemo(
    () => ({
      hoveredGuid,
      selectedGuid: selected?.guid ?? null,
      snapParentGuid: snapTarget?.parentGuid ?? null,
      snapTarget,
    }),
    [hoveredGuid, selected?.guid, snapTarget]
  );

  function mousePosition(evt: React.MouseEvent): WorkspacePosition {
    return clientPosition(evt.clientX, evt.clientY);
  }

  function clientPosition(clientX: number, clientY: number): WorkspacePosition {
    const svg = document.getElementById("blockSpace") as unknown as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return { x: 80, y: 80 };
    return {
      x: (clientX - ctm.e) / ctm.a,
      y: (clientY - ctm.f) / ctm.d,
    };
  }

  function roundWorkspace(n: number): number {
    return Math.round(n * 1000) / 1000;
  }

  function parseTranslate(element: Element): WorkspacePosition {
    const transform = element.getAttribute("transform") ?? "";
    const match = /translate\(\s*([^,\s]+)[,\s]+([^)]+)\)/.exec(transform);
    if (!match) return { x: 0, y: 0 };
    return { x: Number(match[1]) || 0, y: Number(match[2]) || 0 };
  }

  function elementWorkspacePosition(element: SVGGraphicsElement): WorkspacePosition {
    const rect = element.getBoundingClientRect();
    return clientPosition(rect.left, rect.top);
  }

  function sameSnapTarget(left: DragSnapTarget | null, right: DragSnapTarget | null): boolean {
    return (
      left?.kind === right?.kind &&
      left?.parentGuid === right?.parentGuid &&
      left?.key === right?.key &&
      left?.idx === right?.idx
    );
  }

  function setVisualPosition(guid: string, pos: WorkspacePosition, immediate = false) {
    if (immediate) {
      const next = { ...dragPositionsRef.current, [guid]: pos };
      dragPositionsRef.current = next;
      pendingDragPosition.current = null;
      setDragPositions(next);
      return;
    }

    pendingDragPosition.current = { guid, pos };
    if (dragFrame.current !== null) return;

    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null;
      const pending = pendingDragPosition.current;
      pendingDragPosition.current = null;
      if (!pending) return;

      const current = dragPositionsRef.current;
      const prev = current[pending.guid];
      if (prev && prev.x === pending.pos.x && prev.y === pending.pos.y) return;

      const next = { ...current, [pending.guid]: pending.pos };
      dragPositionsRef.current = next;
      setDragPositions(next);
    });
  }

  function clearVisualPosition(guid: string) {
    if (pendingDragPosition.current?.guid === guid) {
      pendingDragPosition.current = null;
    }
    if (dragFrame.current !== null) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    const { [guid]: _removed, ...next } = dragPositionsRef.current;
    dragPositionsRef.current = next;
    setDragPositions(next);
  }

  function setHoveredGuidIfChanged(guid: string | null) {
    if (hoveredGuidRef.current === guid) return;
    hoveredGuidRef.current = guid;
    setHoveredGuid(guid);
  }

  function isTextEditingTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    );
  }

  function dropDistance(drop: Element, clientX: number, clientY: number): number {
    const rect = drop.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(clientX, rect.right));
    const y = Math.max(rect.top, Math.min(clientY, rect.bottom));
    return Math.hypot(clientX - x, clientY - y);
  }

  function snapTargetFromDrop(drop: Element | null, kind: "expression" | "statement"): DragSnapTarget | null {
    if (!drop?.classList.contains(kind)) return null;
    const parentGuid = drop.getAttribute("data-parent-guid");
    const key = drop.getAttribute("data-mutation-key");
    if (!parentGuid || !key) return null;
    const idx = parseOptionalIndex(drop.getAttribute("data-mutation-idx"));
    return idx === undefined ? { kind, parentGuid, key } : { kind, parentGuid, key, idx };
  }

  function nearestSnapTarget(clientX: number, clientY: number, kind: "expression" | "statement"): DragSnapTarget | null {
    const exact = document.elementFromPoint(clientX, clientY)?.closest(".drop") ?? null;
    const exactTarget = snapTargetFromDrop(exact, kind);
    if (exactTarget) return exactTarget;

    let best: Element | null = null;
    let bestDistance = 56;
    document.querySelectorAll(`.drop.${kind}`).forEach((drop) => {
      const distance = dropDistance(drop, clientX, clientY);
      if (distance < bestDistance) {
        best = drop;
        bestDistance = distance;
      }
    });
    return snapTargetFromDrop(best, kind);
  }

  function snapPoint(target: DragSnapTarget): WorkspacePosition | null {
    const idxSelector = target.idx === undefined
      ? ":not([data-mutation-idx])"
      : `[data-mutation-idx="${target.idx}"]`;
    const drop = document.querySelector(
      `.drop.${target.kind}[data-parent-guid="${cssEscape(target.parentGuid)}"][data-mutation-key="${cssEscape(target.key)}"]${idxSelector}`
    );
    if (!drop) return null;
    const rect = drop.getBoundingClientRect();
    return clientPosition(rect.left, rect.top);
  }

  function syntaxTargetFromElement(element: Element | null): SyntaxTarget | null {
    const selectedElement = element?.closest(SYNTAX_SELECTOR) as SVGElement | null;
    if (!selectedElement) return null;
    const next: SyntaxTarget = {
      guid: selectedElement.getAttribute("data-guid")!,
      kind: selectedElement.classList.contains("statement")
        ? "statement"
        : selectedElement.classList.contains("expression")
          ? "expression"
          : "declaration",
    };
    const parentGuid = selectedElement.getAttribute("data-parent-guid");
    const key = selectedElement.getAttribute("data-mutation-key");
    if (parentGuid !== null) next.parentGuid = parentGuid;
    if (key !== null) next.key = key;
    const idx = parseOptionalIndex(selectedElement.getAttribute("data-mutation-idx"));
    if (idx !== undefined) next.idx = idx;
    return next;
  }

  function isNestedSyntaxInsideDetached(syntax: Element): boolean {
    const detached = syntax.closest("[data-detached-guid]");
    const parentSyntax = syntax.parentElement?.closest(SYNTAX_SELECTOR);
    return Boolean(detached && parentSyntax && detached.contains(parentSyntax));
  }

  function beginDetachedDrag(evt: React.MouseEvent): boolean {
    if (evt.button !== 0) return false;
    const targetElement = evt.target as Element;
    const syntax = targetElement.closest(SYNTAX_SELECTOR);
    if (syntax && isNestedSyntaxInsideDetached(syntax)) {
      return false;
    }
    const detached = targetElement.closest("[data-detached-guid]") as SVGGElement | null;
    if (!detached) return false;
    const guid = detached.getAttribute("data-detached-guid");
    const kind = detached.getAttribute("data-port-compatibility") as "expression" | "statement" | null;
    if (!guid || !kind) return false;

    const mouse = mousePosition(evt);
    const pos = parseTranslate(detached);
    detachedDrag.current = {
      guid,
      kind,
      offset: { x: mouse.x - pos.x, y: mouse.y - pos.y },
      pos,
      snap: null,
    };
    detached.classList.add("nomouse");
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function beginGlobalDrag(evt: React.MouseEvent): boolean {
    if (evt.button !== 0) return false;
    const targetElement = evt.target as Element;
    if (
      targetElement.closest(".drop") ||
      targetElement.closest("[data-detached-guid]") ||
      targetElement.closest(".button") ||
      isTextEditingTarget(evt.target)
    ) {
      return false;
    }

    const global = targetElement.closest(".global[data-guid]") as SVGGElement | null;
    if (!global) return false;
    const guid = global.getAttribute("data-guid");
    if (!guid) return false;

    const mouse = mousePosition(evt);
    const pos = parseTranslate(global);
    globalDrag.current = {
      guid,
      offset: { x: mouse.x - pos.x, y: mouse.y - pos.y },
      pos,
    };
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function beginAttachedDrag(evt: React.MouseEvent): boolean {
    if (evt.button !== 0) return false;
    const targetElement = evt.target as Element;
    if (
      targetElement.closest(".drop") ||
      targetElement.closest(".button") ||
      targetElement.tagName === "INPUT"
    ) {
      return false;
    }

    const syntax = targetElement.closest(SYNTAX_SELECTOR) as SVGGraphicsElement | null;
    if (syntax?.closest("[data-detached-guid]") && !isNestedSyntaxInsideDetached(syntax)) {
      return false;
    }
    const target = syntaxTargetFromElement(syntax);
    if (
      !syntax ||
      !target?.parentGuid ||
      !target.key ||
      (target.kind !== "expression" && target.kind !== "statement")
    ) {
      return false;
    }

    attachedDrag.current = {
      element: syntax,
      target: {
        ...target,
        parentGuid: target.parentGuid,
        key: target.key,
        kind: target.kind,
      },
      start: mousePosition(evt),
    };
    return true;
  }

  function moveAttachedDrag(evt: React.MouseEvent): boolean {
    const drag = attachedDrag.current;
    if (!drag) return false;

    const mouse = mousePosition(evt);
    if (Math.hypot(mouse.x - drag.start.x, mouse.y - drag.start.y) <= 7) return false;

    const elementPos = elementWorkspacePosition(drag.element);
    const newPosition = {
      x: roundWorkspace(elementPos.x + (mouse.x - drag.start.x)),
      y: roundWorkspace(elementPos.y + (mouse.y - drag.start.y)),
    };
    const newGuid =
      drag.target.kind === "expression"
        ? Project.detachExpression(drag.target.parentGuid, drag.target.key, newPosition, drag.target.idx)
        : Project.detachStatement(drag.target.parentGuid, drag.target.key, newPosition, drag.target.idx);

    attachedDrag.current = null;
    if (!newGuid) return false;

    detachedDrag.current = {
      guid: newGuid,
      kind: drag.target.kind,
      offset: { x: mouse.x - newPosition.x, y: mouse.y - newPosition.y },
      pos: newPosition,
      snap: null,
    };
    setVisualPosition(newGuid, newPosition, true);
    moveDetachedDrag(evt);
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function moveDetachedDrag(evt: React.MouseEvent): boolean {
    const drag = detachedDrag.current;
    if (!drag) return false;
    const snap = nearestSnapTarget(evt.clientX, evt.clientY, drag.kind);
    if (!sameSnapTarget(drag.snap, snap)) setSnapTarget(snap);
    drag.snap = snap;

    const point = snap ? snapPoint(snap) : null;
    const mouse = mousePosition(evt);
    drag.pos = {
      x: roundWorkspace(point?.x ?? mouse.x - drag.offset.x),
      y: roundWorkspace(point?.y ?? mouse.y - drag.offset.y),
    };
    setVisualPosition(drag.guid, drag.pos);
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function endDetachedDrag(evt: React.MouseEvent): boolean {
    const drag = detachedDrag.current;
    if (!drag) return false;
    detachedDrag.current = null;
    document.querySelector(`[data-detached-guid="${cssEscape(drag.guid)}"]`)?.classList.remove("nomouse");
    if (drag.snap) {
      Project.insertInto(drag.guid, drag.snap.parentGuid, drag.snap.key, drag.snap.idx);
    } else {
      Project.updatePos(drag.guid, drag.pos);
    }
    clearVisualPosition(drag.guid);
    setSnapTarget(null);
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function moveGlobalDrag(evt: React.MouseEvent): boolean {
    const drag = globalDrag.current;
    if (!drag) return false;
    const mouse = mousePosition(evt);
    drag.pos = {
      x: roundWorkspace(mouse.x - drag.offset.x),
      y: roundWorkspace(mouse.y - drag.offset.y),
    };
    setVisualPosition(drag.guid, drag.pos);
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function endGlobalDrag(evt: React.MouseEvent): boolean {
    const drag = globalDrag.current;
    if (!drag) return false;
    globalDrag.current = null;
    Project.updatePos(drag.guid, drag.pos);
    clearVisualPosition(drag.guid);
    evt.preventDefault();
    evt.stopPropagation();
    return true;
  }

  function endAttachedDrag() {
    attachedDrag.current = null;
  }

  function targetContext(evt: React.MouseEvent, includeWorkspace: boolean): InsertContext | null {
    const eventTarget = evt.target as Element;
    const target = eventTarget.closest(".drop") ?? eventTarget;
    if (target.classList.contains("drop")) {
      const context: InsertContext = {
        kind: target.classList.contains("expression") ? "expression" : "statement",
        pos: mousePosition(evt),
      };
      const parentGuid = target.getAttribute("data-parent-guid");
      const key = target.getAttribute("data-mutation-key");
      if (parentGuid !== null) context.parentGuid = parentGuid;
      if (key !== null) context.key = key;
      const idx = parseOptionalIndex(target.getAttribute("data-mutation-idx"));
      if (idx !== undefined) context.idx = idx;
      if (target.classList.contains("expression") || target.classList.contains("statement")) return context;
    }
    if (includeWorkspace && target.id === "workspaceBackground") {
      return { kind: "declaration", pos: mousePosition(evt) };
    }
    return null;
  }

  function selectTarget(evt: React.MouseEvent) {
    setSelected(syntaxTargetFromElement(evt.target as Element));
  }

  function handleMouseDown(evt: React.MouseEvent) {
    pointerStart.current = { x: evt.clientX, y: evt.clientY };
    if (!isTextEditingTarget(evt.target)) evt.preventDefault();
    if (beginAttachedDrag(evt)) return;
    if (beginDetachedDrag(evt)) return;
    beginGlobalDrag(evt);
  }

  function handleMouseMove(evt: React.MouseEvent) {
    if (moveDetachedDrag(evt)) return;
    if (moveAttachedDrag(evt)) return;
    if (moveGlobalDrag(evt)) return;
    setHoveredGuidIfChanged(syntaxTargetFromElement(evt.target as Element)?.guid ?? null);
  }

  function handleMouseUp(evt: React.MouseEvent) {
    endDetachedDrag(evt);
    endGlobalDrag(evt);
    endAttachedDrag();
  }

  function handleMouseLeave(evt: React.MouseEvent) {
    endDetachedDrag(evt);
    endGlobalDrag(evt);
    endAttachedDrag();
    setHoveredGuidIfChanged(null);
  }

  function handleClick(evt: React.MouseEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start && Math.hypot(evt.clientX - start.x, evt.clientY - start.y) > 6) {
      return;
    }
    const context = targetContext(evt, false);
    if (context) {
      setInsertContext(context);
      setSelected(null);
      return;
    }
    if ((evt.target as Element).id === "workspaceBackground") {
      setSelected(null);
      setInsertContext(null);
      return;
    }
    selectTarget(evt);
  }

  function handleDoubleClick(evt: React.MouseEvent) {
    const context = targetContext(evt, true);
    if (context) {
      setInsertContext(context);
      setSelected(null);
    }
  }

  function handleContextMenu(evt: React.MouseEvent) {
    evt.preventDefault();
    selectTarget(evt);
  }

  function deleteSelected() {
    if (!selected) return;
    if (selected.parentGuid && selected.key && selected.kind && selected.kind !== "declaration") {
      Project.deleteChild(selected.parentGuid, selected.key, selected.idx, selected.kind);
    } else {
      Project.rmNodeByGUID(selected.guid);
    }
    setSelected(null);
  }

  React.useEffect(() => {
    function onKeyDown(evt: KeyboardEvent) {
      const target = evt.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (!selected || (evt.key !== "Delete" && evt.key !== "Backspace")) return;
      evt.preventDefault();
      deleteSelected();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return {
    dragPositions,
    insertContext,
    interactionState,
    selected,
    clearInsertContext: () => setInsertContext(null),
    deleteSelected,
    eventHandlers: {
      onClick: handleClick,
      onContextMenu: handleContextMenu,
      onDoubleClick: handleDoubleClick,
      onMouseDown: handleMouseDown,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  };
}
