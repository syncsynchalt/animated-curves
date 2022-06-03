import * as draw25519 from './curve25519/draw-25519.js';
import * as draw from './curve/draw.js';
import * as sample from './ec-samples/sample-draw.js';
import * as real from './real-curve/real-draw.js';
import * as common from './common.js';
import * as field from './field-math/field-draw.js';
import {startVisibleCanvases} from './common.js';

(async () => {

    let setupScrollListener = () => {
        let ticking = false;
        function scrollEvent() {
            ticking = false;
            common.startVisibleCanvases();
        }
        document.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(scrollEvent);
            }
        });
    };


    let curve25519Setup = async () => {
        const canvas = common.byId('canvas-curve25519');
        const ctx = common.convertCanvasHiDPI(canvas);

        let n = 1;
        let Q = draw25519.P;
        const startDemo = () => {
            let updateCb = (R) => { n++; Q = R };
            return draw25519.runDemo(ctx, updateCb, () => {}, n, Q);
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    };

    let ecSampleSetup = async () => {
        const canvas = common.byId('canvas-ec-sample');
        const ctx = common.convertCanvasHiDPI(canvas);

        let a = -1, b = -1;
        const startDemo = async () => {
            return sample.runDemo(ctx, a, b, (newA, newB) => { [a, b] = [newA, newB] });
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
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
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    };

    let realAssocSetup = async () => {
        const canvas = common.byId('canvas-real-assoc');
        const ctx = common.convertCanvasHiDPI(canvas);
        let startDemo = async () => {
            await real.runAssocDemo(ctx);
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    };


    let fieldSetup = async () => {
        let canvas = common.byId('canvas-field-add-sub');
        let ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runAddSubDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-mult');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runMultDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-div');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runDivDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-sqrt');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runSqrtDemo, common.cancelAnimation);
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
            let drawDoneCb = (R) => { setPageStuff(R) };
            let updateCb = (R) => { Q = R; n++ };
            return draw.runDemo(ctx, updateCb, drawDoneCb, Q);
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    };

    async function onload() {
        setupScrollListener();
        await curve25519Setup();
        await ecSampleSetup();
        await realAddSetup();
        await realAssocSetup();
        await fieldSetup();
        await curveSetup();
        await addPSetup();
        startVisibleCanvases();
    }

    if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
