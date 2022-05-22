
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
        can._ratio = PIXEL_RATIO;
        can.width = w * ratio;
        can.height = h * ratio;
        can.style.width = w + 'px';
        can.style.height = h + 'px';
        can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
        return can;
    };

    async function onload() {
        const container = document.getElementById('canvas-container');
        const canvas = createHiDPICanvas(container, 500, 500);
        canvas.style.border = '1px solid grey';
        const ctx = canvas.getContext('2d');
        await draw.resetGraph(ctx);

        let pointDesc = (p) => {
            if (p === undefined) return '...';
            if (p === null) return draw.INFINITY;
            return `(${p.x}, ${p.y})`;
        };

        let n = 1;
        let Q = undefined;
        let demoTimeout;
        document.getElementById('btn-add1').onclick = async () => {
            if (demoTimeout) clearTimeout(demoTimeout);
            n++;
            Q = await draw.addP(ctx, Q, (R) => {
                document.getElementById('np').textContent = pointDesc(R);
            });
            document.getElementById('n').textContent = n.toString();
            document.getElementById('np-desc').style.visibility = 'visible';
            document.getElementById('np').textContent = pointDesc();
        };
        document.getElementById('btn-add10').onclick = async () => {
            if (demoTimeout) clearTimeout(demoTimeout);
            for (let i = 0; i < 10; i++) {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    document.getElementById('np').textContent = pointDesc(R);
                });
            }
            document.getElementById('n').textContent = n.toString();
            document.getElementById('np-desc').style.visibility = 'visible';
            document.getElementById('np').textContent = pointDesc();
        };
        // xxx remove this
        document.getElementById('btn-add71').onclick = async () => {
            if (demoTimeout) clearTimeout(demoTimeout);
            for (let i = 0; i < 71; i++) {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    document.getElementById('np').textContent = pointDesc(R);
                });
            }
            document.getElementById('n').textContent = n.toString();
            document.getElementById('np-desc').style.visibility = 'visible';
            document.getElementById('np').textContent = pointDesc();
        };
        document.getElementById('btn-reset').onclick = async () => {
            if (demoTimeout) clearTimeout(demoTimeout);
            n = 1;
            Q = undefined;
            await draw.resetGraph(ctx);
            document.getElementById('np-desc').style.visibility = 'hidden';
        };
        document.getElementById('btn-demo').onclick = async () => {
            if (demoTimeout) clearTimeout(demoTimeout);
            let next = async () => {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    document.getElementById('np').textContent = pointDesc(R);
                    demoTimeout = setTimeout(() => { next() }, 1.5 * 1000);
                });
                document.getElementById('n').textContent = n.toString();
                document.getElementById('np-desc').style.visibility = 'visible';
                document.getElementById('np').textContent = pointDesc();
            };
            await next();
        };
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
