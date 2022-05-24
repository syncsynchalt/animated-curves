import * as draw25519 from './curve25519/draw.js';
import * as draw from './curve/draw.js';
import * as common from './common.js';

(async () => {

    let curve25519Setup = async () => {
        const canvas = common.byId('canvas-curve25519');
        const ctx = common.convertCanvasHiDPI(canvas);
        await draw25519.resetGraph(ctx);

        /** @param v {BigInt} */
        let pointDesc = (v) => {
            if (v === undefined) return '...';
            return `${v.toString(16)}`;
        };

        let n = 1;
        let Q = draw25519.P;
        let setPageStuff = (R) => {
            common.byId('n-255').textContent = n.toString();
            common.byId('np-x-255').textContent = pointDesc(R?.x);
            common.byId('np-y-255').textContent = pointDesc(R?.y);
        };

        const startDemo = () => {
            draw25519.cancelDemo();
            let drawDoneCb = (R) => { setPageStuff(R) };
            let updateCb = (R) => { Q = R; n++; setPageStuff(R) };
            return draw25519.runDemo(ctx, updateCb, drawDoneCb, Q);
        };
        common.byId('btn-play-255').onclick = async () => {
            await startDemo();
        };
        common.byId('btn-stop-255').onclick = async () => {
            draw25519.cancelDemo();
        };

        await startDemo();
    };

    let addPSetup = async () => {
        const canvas = common.byId('canvas-addp');
        const ctx = common.convertCanvasHiDPI(canvas);
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
        await curve25519Setup();
        await addPSetup();
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
