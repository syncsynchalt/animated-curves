
(async () => {
    let draw = await import('./draw.js');

    const PIXEL_RATIO = (ctx) => {
        // noinspection JSUnresolvedVariable
        const dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;
        return dpr / bsr;
    };

    let createHiDPICanvas = function(parent, w, h) {
        const can = parent.appendChild(document.createElement('canvas'));
        const ctx = can.getContext('2d', {alpha: false});
        const ratio = PIXEL_RATIO(ctx);
        can._ratio = ratio;
        can.width = w * ratio;
        can.height = h * ratio;
        can.style.width = w + 'px';
        can.style.height = h + 'px';
        ctx.scale(ratio, ratio);
        return [can, ctx];
    };

    async function onload() {
        const container = document.getElementById('canvas-container');
        const [canvas, ctx] = createHiDPICanvas(container, 500, 400);
        canvas.style.border = '1px solid grey';
        await draw.resetGraph(ctx);

        let pointDesc = (p) => {
            if (p === undefined) return '...';
            if (p === null) return draw.INFINITY;
            return `(${p.x}, ${p.y})`;
        };

        let n = 1;
        let Q = undefined;
        document.getElementById('btn-add1').onclick = async () => {
            draw.cancelDemo();
            n++;
            Q = await draw.addP(ctx, Q, (R) => {
                document.getElementById('np').classList.remove('calculating');
                document.getElementById('np').textContent = pointDesc(R);
            });
            document.getElementById('n').textContent = n.toString();
            document.getElementById('np-desc').style.visibility = 'visible';
            document.getElementById('np').classList.add('calculating');
            document.getElementById('np').textContent = pointDesc();
        };
        document.getElementById('btn-add10').onclick = async () => {
            draw.cancelDemo();
            for (let i = 0; i < 10; i++) {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    document.getElementById('np').classList.remove('calculating');
                    document.getElementById('np').textContent = pointDesc(R);
                });
            }
            document.getElementById('n').textContent = n.toString();
            document.getElementById('np-desc').style.visibility = 'visible';
            document.getElementById('np').classList.add('calculating');
            document.getElementById('np').textContent = pointDesc();
        };
        // xxx remove this
        document.getElementById('btn-add71').onclick = async () => {
            draw.cancelDemo();
            for (let i = 0; i < 71; i++) {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    document.getElementById('np').classList.remove('calculating');
                    document.getElementById('np').textContent = pointDesc(R);
                });
            }
            document.getElementById('n').textContent = n.toString();
            document.getElementById('np-desc').style.visibility = 'visible';
            document.getElementById('np').classList.add('calculating');
            document.getElementById('np').textContent = pointDesc();
        };
        document.getElementById('btn-reset').onclick = async () => {
            draw.cancelDemo();
            n = 1;
            Q = undefined;
            await draw.resetGraph(ctx);
            document.getElementById('np-desc').style.visibility = 'hidden';
        };
        document.getElementById('btn-demo').onclick = async () => {
            draw.cancelDemo();
            let updateCb = (R) => {
                Q = R;
                n++;
                document.getElementById('n').textContent = n.toString();
                document.getElementById('np-desc').style.visibility = 'visible';
                document.getElementById('np').classList.add('calculating');
                document.getElementById('np').textContent = pointDesc();
            };
            let drawDoneCb = (R) => {
                document.getElementById('np').classList.remove('calculating');
                document.getElementById('np').textContent = pointDesc(R);
            };
            return draw.runDemo(ctx, updateCb, drawDoneCb, Q);
        };
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
