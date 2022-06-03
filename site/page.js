import * as draw25519 from './curve25519/draw-25519.js';
import * as draw from './curve/draw.js';
import * as sample from './ec-samples/sample-draw.js';
import * as real from './real-curve/real-draw.js';
import * as common from './common.js';
import * as field from './field-math/field-draw.js';

(async () => {

    let curve25519Setup = async () => {
        const canvas = common.byId('canvas-curve25519');
        const ctx = common.convertCanvasHiDPI(canvas);

        let n = 1;
        let Q = draw25519.P;
        const startDemo = () => {
            draw25519.cancelDemo();
            let updateCb = (R) => { n++; Q = R };
            return draw25519.runDemo(ctx, updateCb, () => {}, n, Q);
        };
        await common.addPlayPause(ctx, startDemo, draw25519.cancelDemo);
    };

    let ecSampleSetup = async () => {
        const canvas = common.byId('canvas-ec-sample');
        const ctx = common.convertCanvasHiDPI(canvas);

        let a = -1, b = -1;
        const startDemo = async () => {
            return sample.runDemo(ctx, a, b, (newA, newB) => { [a, b] = [newA, newB] });
        };
        await common.addPlayPause(ctx, startDemo, sample.cancelDemo);
    };

    let realAddSetup = async () => {
        const canvas = common.byId('canvas-real-add');
        const ctx = common.convertCanvasHiDPI(canvas);
        let n = 1;
        let Q = null;
        let startDemo = async () => {
            let update = (nR, R) => { n = nR; Q = R };
            await real.runAddDemo(ctx, n, Q, update);
        };
        await common.addPlayPause(ctx, startDemo, real.cancelDemo);
    };

    let realAssocSetup = async () => {
        const canvas = common.byId('canvas-real-assoc');
        const ctx = common.convertCanvasHiDPI(canvas);
        let startDemo = async () => {
            await real.runAssocDemo(ctx);
        };
        await common.addPlayPause(ctx, startDemo, real.cancelDemo);
    };


    let fieldSetup = async () => {
        let canvas = common.byId('canvas-field-add-sub');
        let ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runAddSubDemo, field.cancelDemo);

        canvas = common.byId('canvas-field-mult');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runMultDemo, field.cancelDemo);

        canvas = common.byId('canvas-field-div');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runDivDemo, field.cancelDemo);

        canvas = common.byId('canvas-field-sqrt');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runSqrtDemo, field.cancelDemo);
    };


    let curveSetup = async () => {
        const canvas = common.byId('canvas-curve61-static');
        const ctx = common.convertCanvasHiDPI(canvas);
        await draw.resetGraph(ctx);
    };


    let addPSetup = async () => {
        const canvas = common.byId('canvas-addp');
        const ctx = common.convertCanvasHiDPI(canvas);

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
        await common.addPlayPause(ctx, startDemo, draw.cancelDemo);
    };

    async function onload() {
        await curve25519Setup();
        await ecSampleSetup();
        await realAddSetup();
        await realAssocSetup();
        await fieldSetup();
        await curveSetup();
        await addPSetup();
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
