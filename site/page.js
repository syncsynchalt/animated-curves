import * as draw from './curve/draw.js';
import * as common from './common.js';

(async () => {

    let addPSetup = async () => {
        const canvas = common.byId('canvas-addp');
        const ctx = common.convertCanvasHiDPI(canvas);
        canvas.style.border = '1px solid grey';
        await draw.resetGraph(ctx);

        let pointDesc = (p) => {
            if (p === undefined) return '...';
            if (p === null) return draw.INFINITY;
            return `(${p.x}, ${p.y})`;
        };

        let n = 1;
        let Q = undefined;
        let setPageStuff = (R) => {
            common.byId('n').textContent = n.toString();
            common.byId('np').textContent = pointDesc(R);
            common.byId('np').classList.toggle('calculating', !R);
            common.byId('np-desc').classList.toggle('hidden', n === 1);
        };

        common.byId('btn-add1').onclick = async () => {
            draw.cancelDemo();
            n++;
            Q = await draw.addP(ctx, Q, (R) => {
                setPageStuff(R);
            });
            setPageStuff();
        };
        common.byId('btn-add10').onclick = async () => {
            draw.cancelDemo();
            for (let i = 0; i < 10; i++) {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    setPageStuff(R);
                });
            }
            setPageStuff();
        };
        // xxx remove this
        common.byId('btn-add71').onclick = async () => {
            draw.cancelDemo();
            for (let i = 0; i < 71; i++) {
                n++;
                Q = await draw.addP(ctx, Q, (R) => {
                    setPageStuff(R);
                });
            }
            setPageStuff();
        };
        common.byId('btn-reset').onclick = async () => {
            draw.cancelDemo();
            n = 1;
            Q = undefined;
            await draw.resetGraph(ctx);
            setPageStuff();
        };
        common.byId('btn-demo').onclick = async () => {
            draw.cancelDemo();
            let drawDoneCb = (R) => { setPageStuff(R) };
            let updateCb = (R) => { Q = R; n++; setPageStuff() };
            return draw.runDemo(ctx, updateCb, drawDoneCb, Q);
        };
    };

    async function onload() {
        await addPSetup();
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
