(async () => {
    let draw = await import('./curve/draw.js');
    let common = await import('./common.js');

    async function onload() {
        const container = document.getElementById('canvas-addp');
        const [canvas, ctx] = common.createHiDPICanvas(container, 500, 400);
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
            document.getElementById('np-desc').classList.remove('hidden');
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
            document.getElementById('np-desc').classList.remove('hidden');
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
            document.getElementById('np-desc').classList.remove('hidden');
            document.getElementById('np').classList.add('calculating');
            document.getElementById('np').textContent = pointDesc();
        };
        document.getElementById('btn-reset').onclick = async () => {
            draw.cancelDemo();
            n = 1;
            Q = undefined;
            await draw.resetGraph(ctx);
            document.getElementById('np-desc').classList.add('hidden');
        };
        document.getElementById('btn-demo').onclick = async () => {
            draw.cancelDemo();
            let updateCb = (R) => {
                Q = R;
                n++;
                document.getElementById('n').textContent = n.toString();
                document.getElementById('np-desc').classList.remove('hidden');
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
