
(async () => {
    let draw = await import('./draw.js');

    const PIXEL_RATIO = (function() {
        // noinspection JSUnresolvedVariable
        const ctx = document.createElement('canvas').getContext('2d'),
            dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;
        return dpr / bsr;
    })();

    let createHiDPICanvas = function(parent, w, h) {
        const ratio = PIXEL_RATIO;
        const can = parent.appendChild(document.createElement('canvas'));
        can.width = w * ratio;
        can.height = h * ratio;
        can.style.width = w + 'px';
        can.style.height = h + 'px';
        can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
        return can;
    };

    function onload() {
        const container = document.getElementById('canvas-container');
        const canvas = createHiDPICanvas(container, 500, 500);
        canvas.style.border = '1px solid grey';
        const ctx = canvas.getContext('2d');
        draw.drawGrid(ctx);
        draw.drawCurve(ctx);

        let Q = undefined;
        document.getElementById('add1').onclick = () => { Q = draw.addP(ctx, Q) };
        document.getElementById('reset').onclick = () => {
            Q = undefined;
            draw.reset(ctx);
        };
    }
    if (document.readyState === 'complete') {
        onload();
    } else {
        window.onload = onload;
    }
})();
