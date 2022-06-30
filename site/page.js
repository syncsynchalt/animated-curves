import * as draw25519 from './curve25519/draw-25519.js';
import * as draw61 from './curve61/draw.js';
import * as curve61 from './curve61/curve.js';
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

    function curve25519Setup() {
        const canvas = common.byId('canvas-curve25519');
        const ctx = common.convertCanvasHiDPI(canvas);

        let n = 1;
        let Q = draw25519.P;
        const startDemo = () => {
            let updateCb = (R) => { n++; Q = R };
            return draw25519.runDemo(ctx, updateCb, () => {}, n, Q);
        };
        common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    function ecSampleSetup() {
        const canvas = common.byId('canvas-ec-sample');
        const ctx = common.convertCanvasHiDPI(canvas);

        let a = -1, b = -1;
        const startDemo = () => {
            return sample.runDemo(ctx, a, b, (newA, newB) => { [a, b] = [newA, newB] });
        };
        common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    function realAddSetup() {
        const canvas = common.byId('canvas-real-add');
        const ctx = common.convertCanvasHiDPI(canvas);
        let n = 1;
        let Q = null;
        let startDemo = async () => {
            let update = (nR, R) => { n = nR; Q = R };
            await real.runAddDemo(ctx, n, Q, update);
        };
        common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    function realAssocSetup() {
        const canvas = common.byId('canvas-real-assoc');
        const ctx = common.convertCanvasHiDPI(canvas);
        let startDemo = async () => {
            await real.runAssocDemo(ctx);
        };
        common.addPlayPause(ctx, startDemo, common.cancelAnimation);
    }

    function fieldSetup() {
        let canvas = common.byId('canvas-field-add-sub');
        let ctx = common.convertCanvasHiDPI(canvas);
        common.addPlayPause(ctx, field.runAddSubDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-mult');
        ctx = common.convertCanvasHiDPI(canvas);
        common.addPlayPause(ctx, field.runMultDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-negate');
        ctx = common.convertCanvasHiDPI(canvas);
        common.addPlayPause(ctx, field.runNegateDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-div');
        ctx = common.convertCanvasHiDPI(canvas);
        common.addPlayPause(ctx, field.runDivDemo, common.cancelAnimation);

        canvas = common.byId('canvas-field-sqrt');
        ctx = common.convertCanvasHiDPI(canvas);
        common.addPlayPause(ctx, field.runSqrtDemo, common.cancelAnimation);
    }

    async function curveSetup() {
        const canvas = common.byId('canvas-curve61-static');
        const ctx = common.convertCanvasHiDPI(canvas);
        await draw61.resetGraph(ctx,true);
    }

    function fCurveSetup() {
        const canvas1 = common.byId('canvas-addp');
        const ctx1 = common.convertCanvasHiDPI(canvas1);

        let n = 1;
        let Q = undefined;
        const startDemo1 = () => {
            return draw61.runAddPDemo(ctx1, n, Q, (nR, R) => { n = nR; Q = R });
        };
        common.addPlayPause(ctx1, startDemo1, common.cancelAnimation);

        const canvas2 = common.byId('canvas-double-and-add');
        const ctx2 = common.convertCanvasHiDPI(canvas2);
        const captionTag = common.byId('dbl-add-caption');
        const startDemo2 = () => {
            return draw61.runDoubleAddDemo(ctx2, captionTag, (np) => {
                common.byId('dbl-add-np').textContent = `${np}P`;
            });
        };
        common.addPlayPause(ctx2, startDemo2, common.cancelAnimation);
    }

    async function exchangeSetup() {
        const canvasA = common.byId('canvas-alice');
        const canvasB = common.byId('canvas-bob');
        const alice = {
            ctx: common.convertCanvasHiDPI(canvasA),
            input: common.byId('alice-key'),
            desc: common.byId('alice-desc'),
        };
        const bob = {
            ctx: common.convertCanvasHiDPI(canvasB),
            input: common.byId('bob-key'),
            desc: common.byId('bob-desc'),
        };
        await draw61.labelIdleGraph(alice.ctx, 'Enter value for Alice or click "Random"');
        await draw61.labelIdleGraph(bob.ctx, 'Enter value for Bob or click "Random"');

        let formCheck = () => {
            const goButton = common.byId('go-exchange');
            alice.input.value = alice.input.value.replaceAll(/\D/g, '').substring(0, 4);
            bob.input.value = bob.input.value.replaceAll(/\D/g, '').substring(0, 4);
            if (alice.input.validity.valid && bob.input.validity.valid) {
                goButton.removeAttribute('disabled');
            } else {
                goButton.setAttribute('disabled', 'disabled');
            }
        };
        alice.input.onkeyup = formCheck;
        bob.input.onkeyup = formCheck;

        function tweakValues() {
            let ka = alice.input.value;
            let kb = bob.input.value;
            let changed;
            do {
                changed = false;
                while (ka % curve61.basePointOrder === 0) { ka++; changed = true }
                while (kb % curve61.basePointOrder === 0) { kb++; changed = true }
                while ((ka * kb) % curve61.basePointOrder === 0) { ka++; changed = true }
            } while (changed);
            alice.input.value = ka;
            bob.input.value = kb;
        }

        common.byId('go-exchange').addEventListener('click', async () => {
            tweakValues();
            common.cancelAnimation(alice.ctx);
            common.cancelAnimation(bob.ctx);
            await draw61.runExchangeDemo(alice, bob);
        });
        common.byId('rand-exchange').addEventListener('click', () => {
            let ka = Math.ceil(Math.random() * 256);
            let kb = Math.ceil(Math.random() * 256);
            while (ka === kb) {
                kb = Math.ceil(Math.random() * 256);
            }
            alice.input.value = ka;
            bob.input.value = kb;
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
