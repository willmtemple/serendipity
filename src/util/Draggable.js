import projectStore from '../stores/ProjectStore';

export function makeDraggable(svg) {
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    let selectedElement, offset, transform;

    function getMousePosition(evt) {
        const ctm = svg.getScreenCTM();
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
        return node === svg ? null : node;
    }

    function startDrag(evt) {
        if (evt.target.tagName !== "INPUT") {
            const node = findDragRoot(evt.target);
            if (node) {
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
        if (selectedElement) {
            evt.preventDefault();
            const mouse = getMousePosition(evt);
            transform.setTranslate(mouse.x - offset.x, mouse.y - offset.y);
        }
    }

    function endDrag(evt) {
        if (selectedElement) {
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
}