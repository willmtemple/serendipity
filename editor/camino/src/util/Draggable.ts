import { Prefs } from "@serendipity/editor-stores";

import { Position } from "./Position";

import normalizeWheel from "normalize-wheel";
import { action } from "mobx";
import { roundQuantum } from "./quantum";

// This module handles all of the dynamic drag operations using direct DOM
// manipulation. We have to be careful here not to piss off React,
// because we are directly and intentionally violating its design principles by
// adding classes and transforms here outside of the state-management that is
// internal to react.

// I have been very careful to only change things that I have not added as
// reactions in the components.

declare global {
  interface SVGSVGElement {
    isDraggable: boolean;
  }
}

let _resize: () => void | undefined;

export function resize() {
  _resize?.();
}

export function makeDraggable(_svg: SVGSVGElement) {
  if (_svg.isDraggable) {
    return () => {};
  }

  _svg.isDraggable = true;

  _svg.addEventListener("mousedown", startDrag);
  _svg.addEventListener("mousemove", drag);
  _svg.addEventListener("mouseup", endDrag);
  _svg.addEventListener("mouseleave", endDrag);

  const wheelHandler = action(zoom);
  _svg.addEventListener("wheel", wheelHandler);

  const svg = document.getElementById("blockSpace") as unknown as SVGSVGElement;
  const bgSvg = document.getElementById("workspaceBackgroundContainer") as unknown as SVGSVGElement;

  if (!svg || !bgSvg) {
    throw new Error("Failed to get a reference to the true block workspace.");
  }

  // Add a hook to resize events on the window that will adjust the
  // SVG viewBox to keep it at the correct size
  window.addEventListener("resize", resizeViewBox);

  const initialRect = _svg.getClientRects()[0]!;
  const svgDims = {
    height: initialRect.height,
    left: Prefs.prefs.editorPosition.x,
    scale: Prefs.prefs.editorScale,
    top: Prefs.prefs.editorPosition.y,
    width: initialRect.width,
  };

  function resizeViewBox() {
    const rect = _svg.getClientRects()[0];
    if (rect !== undefined) {
      svgDims.width = rect.width;
      svgDims.height = rect.height;
      setViewBox();
    }
  }

  _resize = resizeViewBox;

  let isPanning = false;
  let offset: Position = { x: 0, y: 0 };
  const background: HTMLElement | null = document.getElementById("workspaceBackground");
  const svgBackground = background as unknown as SVGGraphicsElement;
  const bgTranslate = svg.createSVGTransform();
  svgBackground.transform.baseVal.insertItemBefore(bgTranslate, 0);

  let canUpdate: boolean = true;

  function pixelStep(): number {
    return svgDims.scale / (window.devicePixelRatio || 1);
  }

  function snapPixel(n: number): number {
    const step = pixelStep();
    return Math.round(n / step) * step;
  }

  const animate: FrameRequestCallback = (_t) => {
    requestAnimationFrame(animate);
    if (!canUpdate) {
      setViewBox();
    }
  };

  requestAnimationFrame(animate);

  function setViewBox() {
    const { left, top, width, height, scale } = svgDims;

    const snappedLeft = snapPixel(left);
    const snappedTop = snapPixel(top);
    const scaledWidth = snapPixel(width * scale);
    const scaledHeight = snapPixel(height * scale);

    svg.setAttribute("viewBox", `${snappedLeft} ${snappedTop} ${scaledWidth} ${scaledHeight}`);
    bgSvg.setAttribute("viewBox", `${snappedLeft} ${snappedTop} ${scaledWidth} ${scaledHeight}`);

    const bgLeft = snapPixel(snappedLeft - width);
    const bgTop = snapPixel(snappedTop - height);
    bgTranslate.setTranslate(bgLeft - (bgLeft % 50), bgTop - (bgTop % 50));

    canUpdate = true;
  }
  resizeViewBox();

  function getMousePosition(evt: MouseEvent): Position {
    const ctm = svg.getScreenCTM() as DOMMatrix;
    return {
      x: (evt.clientX - ctm.e) / ctm.a,
      y: (evt.clientY - ctm.f) / ctm.d,
    };
  }

  function findDragRoot(e: Element): Element | null {
    let node: Element | null = e;
    while (
      node &&
      node !== _svg &&
      !node.classList.contains("global") &&
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

    if (evt.shiftKey) {
      // Shift drag to select
      return;
    }

    const t = evt.target as Element;
    const node = findDragRoot(evt.target as Element);

    if (t.closest(".drop")) {
      return;
    }

    if (t.closest("[data-detached-guid]")) {
      return;
    }

    if (node && node.classList.contains("button")) {
      return;
    }

    if (t.tagName !== "INPUT") {
      if (node === _svg) {
        // Drag the background
        isPanning = true;
        offset = getMousePosition(evt);
      }
    }
  }

  function drag(evt: MouseEvent) {
    const mouse = getMousePosition(evt);
    if (isPanning) {
      if (canUpdate) {
        evt.preventDefault();
        svgDims.left -= mouse.x - offset.x;
        svgDims.top -= mouse.y - offset.y;

        svgDims.left = snapPixel(svgDims.left);
        svgDims.top = snapPixel(svgDims.top);

        canUpdate = false;

        // setViewBox();
      }
    }
  }

  function endDrag() {
    if (isPanning) {
      Prefs.setPosition(roundQuantum(svgDims.left), roundQuantum(svgDims.top));
    }
    isPanning = false;
  }

  function zoom(bEvt: WheelEvent) {
    const evt = normalizeWheel(bEvt);
    // Don't zoom while dragging anything.
    if (!isPanning) {
      if (canUpdate) {
        const oldScale = svgDims.scale;
        let nextScale = oldScale + evt.spinY / 6;
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

        svgDims.left = snapPixel(svgDims.left);
        svgDims.top = snapPixel(svgDims.top);

        Prefs.setPosition(roundQuantum(svgDims.left), roundQuantum(svgDims.top));

        canUpdate = false;

        // setViewBox();
      }
    }
  }

  return () => {
    _svg.removeEventListener("mousedown", startDrag);
    _svg.removeEventListener("mousemove", drag);
    _svg.removeEventListener("mouseup", endDrag);
    _svg.removeEventListener("mouseleave", endDrag);
    _svg.removeEventListener("wheel", wheelHandler);
    window.removeEventListener("resize", resizeViewBox);
    _svg.isDraggable = false;
  };
}
