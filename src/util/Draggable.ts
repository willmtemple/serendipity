import prefsStore from '../stores/PrefsStore';
import projectStore from '../stores/ProjectStore';

// This code is spaghett bad typescript
export function makeDraggable(svg : SVGSVGElement) {
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


    let selectedElement : SVGGraphicsElement | undefined;
    let offset: { x: any; y: any; };
    let transform : SVGTransform;
    const background : HTMLElement | null = document.getElementById('workspaceBackground');
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

    function getMousePosition(evt : MouseEvent) {
        const ctm = svg.getScreenCTM() as DOMMatrix;
        return {
            x: (evt.clientX - ctm.e) / ctm.a,
            y: (evt.clientY - ctm.f) / ctm.d
        }
    }

    function findDragRoot(e: Element) {
        let node : Element | null = e;
        while (node && node !== svg && !node.classList.contains('draggable')) {
            node = node.parentElement
        }
        return node;
    }

    function startDrag(evt : MouseEvent) {

        if (evt.button === 2) {
            evt.preventDefault();
            projectStore.insNodeDev(getMousePosition(evt));
        }

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
            } else if (node) {
                selectedElement = node as SVGGraphicsElement;
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

    function drag(evt : MouseEvent) {
        if (selectedElement === svg) {
            evt.preventDefault();
            const mouse = getMousePosition(evt);
            svgDims.left -= mouse.x - offset.x;
            svgDims.top -= mouse.y - offset.y;
            setViewBox();
        } else if (selectedElement) {
            evt.preventDefault();
            const mouse = getMousePosition(evt);
            transform.setTranslate(mouse.x - offset.x, mouse.y - offset.y);
        }
    }

    function endDrag() {
        if (selectedElement === svg) {
            prefsStore.setPosition(svgDims.left, svgDims.top);
        } else if (selectedElement) {
            const guid = selectedElement.getAttribute('data-guid');
            if (guid) {
                projectStore.updatePos(guid, {
                    x: transform.matrix.e,
                    y: transform.matrix.f
                })
            }
        }
        selectedElement = undefined;
    }

    function zoom(evt : MouseWheelEvent) {
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
                const {left, top} = svgDims;
                // Also (1-r)m_{x} - rl , but this uses less mults
                svgDims.left = mouse.x - ((mouse.x - left) * ratio);
                svgDims.top = mouse.y - ((mouse.y - top) * ratio);

                setViewBox();
            }
        }
    }
}