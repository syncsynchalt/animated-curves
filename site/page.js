import * as draw25519 from './curve25519/draw-25519.js';
import * as draw from './curve/draw.js';
import * as sample from './ec-samples/sample-draw.js';
import * as real from './real-curve/real-draw.js';
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
            let updateCb = (R) => { Q = R; n++ };
            return draw25519.runDemo(ctx, updateCb, drawDoneCb, Q);
        };
        canvas.onclick = async () => {
            draw25519.cancelDemo();
            await common.addPlayMask(ctx, async () => { await startDemo() });
        };

        await startDemo();
    };

    let ecSampleSetup = async () => {
        const canvas = common.byId('canvas-ec-sample');
        const ctx = common.convertCanvasHiDPI(canvas);

        const startDemo = async () => {
            let a = -1, b = -1;
            return sample.runDemo(ctx, a, b, (newA, newB) => {
                a = newA;
                b = newB;
                common.byId('ec-sample-a').textContent = a;
                common.byId('ec-sample-b').textContent = b;
            });
        };
        canvas.onclick = async () => {
            sample.cancelDemo();
            await common.addPlayMask(ctx, async () => { await startDemo() });
        };

        await startDemo();
    };

    let realCurveSetup = async () => {
        const canvas = common.byId('canvas-real-curve-1');
        const ctx = common.convertCanvasHiDPI(canvas);
        let n = 1;
        let Q = null;
        let startDemo = async () => {
            let update = (nn, R) => { n = nn; Q = R };
            await real.runDemo(ctx, n, Q, update);
        };

        canvas.onclick = async () => {
            real.cancelDemo();
            await common.addPlayMask(ctx, () => { startDemo() });
        };
        await common.addPlayMask(ctx, () => { startDemo() });
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
        };

        const startDemo = async () => {
            draw.cancelDemo();
            await draw.resetGraph(ctx);
            let drawDoneCb = (R) => { setPageStuff(R) };
            let updateCb = (R) => { Q = R; n++ };
            return draw.runDemo(ctx, updateCb, drawDoneCb, Q);
        };
        canvas.onclick = async () => {
            draw.cancelDemo();
            await common.addPlayMask(ctx, () => { startDemo() });
        };
        await common.addPlayMask(ctx, () => { startDemo() });
    };

    async function onload() {
        await curve25519Setup();
        await ecSampleSetup();
        await realCurveSetup();
        await addPSetup();
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
