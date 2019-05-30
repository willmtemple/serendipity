import prefsStore from '../stores/PrefsStore';
import projectStore from '../stores/ProjectStore';
import { distance, IPosition } from './Position';

// This module handles all of the dynamic drag operations using direct DOM
// manipulation. We have to be careful here not to piss off React,
// because we are directly and intentionally violating its design principles by
// adding classes and transforms here outside of the state-management that is
// internal to react.

// I have been very careful to only change things that I have not added as
// reactions in the components.

// This code is spaghett bad typescript
export function makeDraggable(svg: SVGSVGElement) {
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    svg.addEventListener('wheel', zoom);

    // Add a hook to resize events on the window that will adjust the
    // SVG viewBox to keep it at the correct size
    window.addEventListener('resize', resizeViewBox);

    const initialRect = svg.getClientRects()[0];
    const svgDims = {
        height: initialRect.height,
        left: prefsStore.prefs.editorPosition.x,
        scale: prefsStore.prefs.editorScale,
        top: prefsStore.prefs.editorPosition.y,
        width: initialRect.width,
    }

    function resizeViewBox() {
        const rect = svg.getClientRects()[0];
        svgDims.width = rect.width;
        svgDims.height = rect.height;
        setViewBox();
    }


    let selectedElement: SVGGraphicsElement | undefined;
    let dragMode: "detach" | undefined;
    let dragStart: IPosition | undefined;
    let offset: { x: any; y: any; };
    let transform: SVGTransform;
    let resume: string | undefined;
    const background: HTMLElement | null = document.getElementById('workspaceBackground');
    const svgBackground = background as unknown as SVGGraphicsElement;
    const bgTranslate = svg.createSVGTransform();
    svgBackground.transform.baseVal.insertItemBefore(bgTranslate, 0)

    function setViewBox() {
        const { left, top, width, height, scale } = svgDims;
        svg.setAttribute(
            "viewBox",
            `${left} ${top} ${width * scale} ${height * scale}`
        );
        // Adjust for background scroll and 20% width margins
        // (should be width margin on both top and left, as DOM
        // calculates margins by element width)
        const bgLeft = left - (width * 0.2);
        const bgTop = top - (height * 0.2);
        bgTranslate.setTranslate(bgLeft - (bgLeft % 50), bgTop - (bgTop % 50));
    }
    resizeViewBox();

    function getMousePosition(evt: MouseEvent): IPosition {
        const ctm = svg.getScreenCTM() as DOMMatrix;
        return {
            x: (evt.clientX - ctm.e) / ctm.a,
            y: (evt.clientY - ctm.f) / ctm.d
        }
    }

    function findDragRoot(e: Element) {
        let node: Element | null = e;
        while (node && node !== svg && !node.classList.contains('draggable')) {
            node = node.parentElement
        }
        return node;
    }

    function startDrag(evt: MouseEvent) {

        if (evt.button !== 0) {
            return;
        }

        const t = evt.target as Element;

        if (t.tagName !== "INPUT") {
            const node = findDragRoot(t);
            if (node === svg) {
                // Drag the background
                selectedElement = svg;
                offset = getMousePosition(evt);
            } else if (node && node.classList.contains('expression')) {
                // We are dragging an expression out of its container
                selectedElement = node as SVGGraphicsElement;
                dragMode = "detach";
                dragStart = getMousePosition(evt);
            } else if (node) {
                selectedElement = node as SVGGraphicsElement;

                if (selectedElement.classList.contains('_editor_detachedsyntax')) {
                    selectedElement.classList.add('nomouse');
                }

                offset = getMousePosition(evt);

                const transforms = selectedElement.transform.baseVal;

                // numberOfItems ???????
                if (transforms.numberOfItems === 0 ||
                    transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                    const translate = svg.createSVGTransform();
                    translate.setTranslate(0, 0);

                    selectedElement.transform.baseVal.insertItemBefore(translate, 0);
                }

                transform = transforms.getItem(0);

                offset.x -= transform.matrix.e;
                offset.y -= transform.matrix.f;

                const dataIdx = selectedElement.getAttribute('data-idx');
                const idx = dataIdx && parseInt(dataIdx, 10);
                if (idx && !isNaN(idx)) {
                    projectStore.bump(idx);
                } else {
                    console.warn("Selected global draggable does not have an index.")
                }
            }
        }
    }

    function drag(evt: MouseEvent) {
        // Resume the drag after a previous detach
        if (resume !== undefined) {
            const e = document.getElementById(resume);
            if (e != null) {
                selectedElement = e as unknown as SVGGraphicsElement;
                selectedElement.classList.add('nomouse');

                const transforms = selectedElement.transform.baseVal;

                // numberOfItems ???????
                if (transforms.numberOfItems === 0 ||
                    transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
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
                const guid = selectedElement.getAttribute('data-parent-guid');
                const key = selectedElement.getAttribute('data-mutation-key');
                const idx = selectedElement.getAttribute('data-mutation-idx') || undefined;

                const eltPos = selectedElement.getBoundingClientRect();

                const ctm = svg.getScreenCTM()!;
                const eltX = (eltPos.left - ctm.e) / ctm.a;
                const eltY = (eltPos.top - ctm.f) / ctm.d;

                const newPosition = {
                    x: eltX + (mouse.x - dragStart!.x),
                    y: eltY + (mouse.y - dragStart!.y)
                }

                if (guid && key) {
                    const newGuid = projectStore.detachExpression(guid, key, newPosition, idx ? parseInt(idx, 10) : undefined);
                    dragMode = undefined;
                    offset = {
                        x: mouse.x,
                        y: mouse.y
                    };
                    resume = newGuid;
                } else {
                    console.warn("Tried to detach an element that is marked 'draggable expression' but did not have access info", selectedElement);
                }
            }
        } else if (selectedElement) {
            evt.preventDefault();
            transform.setTranslate(mouse.x - offset.x, mouse.y - offset.y);
        }
    }

    function endDrag(evt: MouseEvent) {
        if (selectedElement === svg) {
            prefsStore.setPosition(svgDims.left, svgDims.top);
        } else if (selectedElement) {
            const mouseOver = evt.target as SVGElement;
            const draggedGuid = selectedElement.getAttribute('data-guid');

            if (draggedGuid) {
                if (mouseOver && mouseOver.classList.contains('dropExpression')) {
                    // We are dropping an element into this target

                    const overGuid = mouseOver.getAttribute('data-parent-guid');
                    const overKey = mouseOver.getAttribute('data-mutation-key');
                    const overIdxS = mouseOver.getAttribute('data-mutation-idx');

                    if (overGuid != null && overKey != null) {
                        const overIdx = (overIdxS != null) ? parseInt(overIdxS, 10) : undefined;

                        projectStore.insertInto(draggedGuid, overGuid, overKey, overIdx);
                    }
                } else {

                    projectStore.updatePos(draggedGuid, {
                        x: transform.matrix.e,
                        y: transform.matrix.f
                    })
                }

            }
            selectedElement.classList.remove('nomouse');
            dragMode = undefined;
        }
        selectedElement = undefined;
    }

    function zoom(evt: MouseWheelEvent) {
        // Don't zoom while dragging anything.
        if (!selectedElement) {
            const oldScale = svgDims.scale;
            const nextScale = oldScale + (evt.deltaY / 500);
            const ratio = nextScale / oldScale;
            if (nextScale > 0.5 && nextScale < 2.0) {
                svgDims.scale = nextScale;
                prefsStore.prefs.editorScale = nextScale;
                // Keep the mouse position fixed in SVG space
                const mouse = getMousePosition(evt);
                const { left, top } = svgDims;
                // Also (1-r)m_{x} - rl , but this uses less mults
                svgDims.left = mouse.x - ((mouse.x - left) * ratio);
                svgDims.top = mouse.y - ((mouse.y - top) * ratio);

                setViewBox();
            }
        }
    }
}