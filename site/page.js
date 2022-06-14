import * as draw25519 from './curve25519/draw-25519.js';
import * as draw from './curve/draw.js';
import * as curve61 from './curve/curve.js';
import * as sample from './ec-samples/sample-draw.js';
import * as real from './real-curve/real-draw.js';
import * as common from './common.js';
import * as field from './field-math/field-draw.js';

(async () => {

    function setupScrollListener() {
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
    }

    async function curve25519Setup() {
        const canvas = common.byId('canvas-curve25519');
        const ctx = common.convertCanvasHiDPI(canvas);

        let n = 1;
        let Q = draw25519.P;
        const startDemo = () => {
            let updateCb = (R) => { n++; Q = R };
            return draw25519.runDemo(ctx, updateCb, () => {}, n, Q);
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    async function ecSampleSetup() {
        const canvas = common.byId('canvas-ec-sample');
        const ctx = common.convertCanvasHiDPI(canvas);

        let a = -1, b = -1;
        const startDemo = async () => {
            return sample.runDemo(ctx, a, b, (newA, newB) => { [a, b] = [newA, newB] });
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    async function realAddSetup() {
        const canvas = common.byId('canvas-real-add');
        const ctx = common.convertCanvasHiDPI(canvas);
        let n = 1;
        let Q = null;
        let startDemo = async () => {
            let update = (nR, R) => { n = nR; Q = R };
            await real.runAddDemo(ctx, n, Q, update);
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    async function realAssocSetup() {
        const canvas = common.byId('canvas-real-assoc');
        const ctx = common.convertCanvasHiDPI(canvas);
        let startDemo = async () => {
            await real.runAssocDemo(ctx);
        };
        await common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    async function fieldSetup() {
        let canvas = common.byId('canvas-field-add-sub');
        let ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runAddSubDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-mult');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runMultDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-negate');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runNegateDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-div');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runDivDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-sqrt');
        ctx = common.convertCanvasHiDPI(canvas);
        await common.addPlayPause(ctx, field.runSqrtDemo, common.cancelAnimation);
    }

    async function curveSetup() {
        const canvas = common.byId('canvas-curve61-static');
        const ctx = common.convertCanvasHiDPI(canvas);
        await draw.resetGraph(ctx,true);
    }

    async function fCurveSetup() {
        const canvas1 = common.byId('canvas-addp');
        const ctx1 = common.convertCanvasHiDPI(canvas1);

        let n = 1;
        let Q = undefined;
        const startDemo1 = async () => {
            return draw.runAddPDemo(ctx1, n, Q, (nR, R) => { n = nR; Q = R });
        };
        await common.addPlayPause(ctx1, startDemo1, common.cancelAnimation);

        const canvas2 = common.byId('canvas-double-and-add');
        const ctx2 = common.convertCanvasHiDPI(canvas2);
        const startDemo2 = async () => {
            return draw.runDoubleAddDemo(ctx2, (np) => {
                common.byId('dbl-add-np').textContent = `${np}`;
            });
        };
        await common.addPlayPause(ctx2, startDemo2, common.cancelAnimation);
    }

    async function exchangeSetup() {
        const canvasA = common.byId('canvas-alice');
        const ctxA = common.convertCanvasHiDPI(canvasA);
        const canvasB = common.byId('canvas-bob');
        const ctxB = common.convertCanvasHiDPI(canvasB);

        let formCheck = () => {
            const goButton = common.byId('go-exchange'),
                aliceInput = common.byId('alice-key'),
                bobInput = common.byId('bob-key');
            aliceInput.value = aliceInput.value.replaceAll(/\D/g, '');
            bobInput.value = bobInput.value.replaceAll(/\D/g, '');
            if (aliceInput.validity.valid && bobInput.validity.valid) {
                goButton.removeAttribute('disabled');
            } else {
                goButton.setAttribute('disabled', 'disabled');
            }
        };
        common.byId('alice-key').onkeyup = formCheck;
        common.byId('bob-key').onkeyup = formCheck;

        function tweakValues() {
            let ka = common.byId('alice-key').value;
            let kb = common.byId('bob-key').value;
            let changed;
            do {
                changed = false;
                while (ka % curve61.basePointOrder === 0) { ka++; changed = true }
                while (kb % curve61.basePointOrder === 0) { kb++; changed = true }
                while ((ka * kb) % curve61.basePointOrder === 0) { ka++; changed = true }
            } while (changed);
            common.byId('alice-key').value = ka;
            common.byId('bob-key').value = kb;
        }

        common.byId('go-exchange').addEventListener('click', async () => {
            tweakValues();
            const ka = common.byId('alice-key').value;
            const kb = common.byId('bob-key').value;

            const waitA = draw.runExchangePubkeyDemo(ctxA, ka, 'A', 'Alice', common.byId('alice-desc'));
            const A = await waitA;
            const waitB = draw.runExchangePubkeyDemo(ctxB, kb, 'B', 'Bob', common.byId('bob-desc'));
            const B = await waitB;
            await common.sleep(2000);
            const _a = draw.runExchangeMultDemo(ctxA, ka, B, 'B', 'Alice', common.byId('alice-desc'));
            const _b = draw.runExchangeMultDemo(ctxB, kb, A, 'A', 'Bob', common.byId('bob-desc'));
            await Promise.all([_a, _b]);
        });
        common.byId('rand-exchange').addEventListener('click', () => {
            let ka = Math.ceil(Math.random() * 256);
            let kb = Math.ceil(Math.random() * 256);
            while (ka === kb) {
                kb = Math.ceil(Math.random() * 256);
            }
            common.byId('alice-key').value = ka;
            common.byId('bob-key').value = kb;
            formCheck();
            common.byId('go-exchange').click();
        });
    }

    async function onload() {
        while (!window.requestAnimationFrame) {
            alert('No support for requestAnimationFrame detected!');
        }
        setupScrollListener();
        await curve25519Setup();
        await ecSampleSetup();
        await realAddSetup();
        await realAssocSetup();
        await fieldSetup();
        await curveSetup();
        await fCurveSetup();
        await exchangeSetup();
        common.startVisibleCanvases();
    }

    if (window.MathJax?.startup?.defaultPageReady) {
        window.MathJax?.startup?.defaultPageReady().then(async () => {
            await onload();
        });
    } else if (document.readyState === 'complete') {
        await onload();
    } else {
        window.onload = onload;
    }
})();
