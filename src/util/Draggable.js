import projectStore from '../stores/ProjectStore';
import prefsStore from '../stores/PrefsStore';

// This code is spaghett
export function makeDraggable(svg) {
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    svg.addEventListener('wheel', zoom);

    const bgRect = document.getElementById('workspaceBackground');

    // Add a hook to resize events on the window that will adjust the
    // SVG viewBox to keep it at the correct size
    window.addEventListener('resize', resizeViewBox);

    const initialRect = svg.getClientRects()[0];
    let svgDims = {
        scale: prefsStore.prefs.editorScale,
        left: prefsStore.prefs.editorPosition.x,
        top: prefsStore.prefs.editorPosition.y,
        width: initialRect.width,
        height: initialRect.height
    }

    function resizeViewBox() {
        const rect = svg.getClientRects()[0];
        svgDims.width = rect.width;
        svgDims.height = rect.height;
        setViewBox();
    }


    let selectedElement, offset, transform, boundCTM;
    const background = document.getElementById('workspaceBackground');
    const bgTranslate = svg.createSVGTransform();
    background.transform.baseVal.insertItemBefore(bgTranslate, 0)

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
    resizeViewBox(svg, bgRect);

    function getMousePosition(evt) {
        const ctm = boundCTM || svg.getScreenCTM();
        return {
            x: (evt.clientX - ctm.e) / ctm.a,
            y: (evt.clientY - ctm.f) / ctm.d
        }
    }

    function findDragRoot(e) {
        let node = e;
        while (node && node !== svg && !node.classList.contains('draggable')) {
            node = node.parentElement
        }
        return node;
    }

    function startDrag(evt) {
        if (evt.button !== 0) {
            return;
        }
        if (evt.target.tagName !== "INPUT") {
            const node = findDragRoot(evt.target);
            if (node === svg) {
                // Drag the background
                selectedElement = svg;
                boundCTM = svg.getSCreenCTM;
                offset = getMousePosition(evt);
            } else if (node) {
                selectedElement = node;
                offset = getMousePosition(evt);

                const transforms = selectedElement.transform.baseVal;

                if (transforms.length === 0 ||
                    transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                    const translate = svg.createSVGTransform();
                    translate.setTranslate(0, 0);

                    selectedElement.transform.baseVal.insertItemBefore(translate, 0);
                }

                transform = transforms.getItem(0);

                offset.x -= transform.matrix.e;
                offset.y -= transform.matrix.f;

                const idx = parseInt(selectedElement.getAttribute('data-idx'));
                if (!isNaN(idx)) {
                    projectStore.bump(idx);
                } else {
                    console.warn("Selected global draggable does not have an index.")
                }
            }
        }
    }

    function drag(evt) {
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

    function endDrag(evt) {
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
        boundCTM = undefined;
    }

    function zoom(evt) {
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