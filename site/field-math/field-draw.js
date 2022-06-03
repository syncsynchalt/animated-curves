import * as fmath from './field-math.js';
import * as common from '../common.js';

const EPS = 0.000001;
const TWO_PI = Math.PI * 2;
const INV_STR = '\u207b\xb9';
const TIMES_STR = '\xd7';

/** @param ctx {CanvasRenderingContext2D} */
function preCalcValues(ctx) {
    const margin = 25;
    const dotRadius = 3;
    const labelHeight = 28;
    const graphHeight = 30;
    const w = ctx.canvas.getBoundingClientRect().width;
    const h = ctx.canvas.getBoundingClientRect().height;
    const ratio = ctx.canvas['_ratio'] || 1;
    const span = w - 2*margin;
    return {
        ctx, ratio, margin, w, h, dotRadius, span, labelHeight, graphHeight
    };
}

/**
 * Given an x point in the graph return the coordinates transformed for the JS Canvas context
 * (adjusted for top-left origin and half-pixel anti-aliasing)
 *
 * @param vals {Object} values from preCalcValues(ctx)
 * @param x {Number} between 0 and p
 * @param halfPixel {Boolean?} if set, round all pixels to nearest .5 (true) or .0 (false)
 * @return {Number[2]} x,y values transformed for canvas context
 */
function xToCtx(vals, x, halfPixel) {
    x = fmath.reduce(x);
    let v = [vals.margin + vals.span * (x/fmath.p), vals.labelHeight + vals.graphHeight/2];
    if (halfPixel) {
        v[0] = ((v[0]+0.5) | 0) - 0.5;
        v[1] = ((v[1]+0.5) | 0) - 0.5;
    }
    return v;
}

/**
 * @param vals {Object} return from cacheVals
 * @param x {Number} coordinate
 * @param color {String} fill style
 * @param radiusAdj {Number?} adjustment to built-in dot radius
 * @param lineWidth {Number?} line width
 * @param strokeStyle {String?} stroke style
 */
function drawDot(vals, x, color,
    radiusAdj, lineWidth, strokeStyle) {
    const ctx = vals.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = strokeStyle || 'black';
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth !== undefined ? lineWidth : 1;
    ctx.arc(...xToCtx(vals, x, true), vals.dotRadius + (radiusAdj || 0), 0, TWO_PI);
    if (lineWidth !== 0) {
        ctx.stroke();
    }
    ctx.fill();
    ctx.restore();
}

function drawGraph(ctx) {
    const vals = preCalcValues(ctx);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, vals.labelHeight, vals.w, vals.h - vals.labelHeight);
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '12px sans';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.moveTo(...xToCtx(vals, 0, true));
    ctx.lineTo(...xToCtx(vals, fmath.p-EPS, true));
    for (let i = 0; i < fmath.p; i++) {
        const pt = xToCtx(vals, i, true);
        ctx.moveTo(pt[0], pt[1]-5);
        ctx.lineTo(pt[0], pt[1]+5);
        if (i % 5 === 0) {
            ctx.fillText(`${i}`, pt[0], pt[1]+10);
        }
    }
    const pt = xToCtx(vals, fmath.p-EPS, true);
    ctx.fillText(`${fmath.p}`, pt[0], pt[1]+10);
    ctx.stroke();
    ctx.restore();
}

/**
 * Write the given label in the top left of the graph.
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {Object} return from preCalcValues()
 * @param label {String} label to write
 */
function writeLabel(ctx, vals, label) {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, vals.w, vals.labelHeight);
    ctx.fillStyle = 'black';
    ctx.font = common.mathFont('18px', false);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, vals.w / 2, 6);
    ctx.restore();
}

/**
 * Add the numbers a and b on the graph of the field Fp.
 * @param ctx {CanvasRenderingContext2D}
 * @param a {Number} first value
 * @param b {Number} second value
 * @param drawDoneCb {Function} callback when animation finished
 * @return {Number} the result
 */
async function addSub(ctx, a, b, drawDoneCb) {
    const vals = preCalcValues(ctx);
    const c = fmath.reduce(a + b);
    const duration = 2000;
    let start;

    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        drawGraph(ctx);
        let mult = (timestamp - start) / duration;
        mult = Math.min(mult, 1.0);
        mult = common.easeInOut(mult);
        let diff = mult * b;
        drawDot(vals, a + diff, 'red');

        if (mult >= 1.0) {
            if (drawDoneCb) drawDoneCb(c);
        } else {
            ctx['_frame'] = requestAnimationFrame(step);
        }
    }
    ctx['_frame'] = requestAnimationFrame(step);
    return c;
}

/**
 * Multiply the numbers a and b on the graph of the field Fp.
 * @param ctx {CanvasRenderingContext2D}
 * @param a {Number} first value
 * @param b {Number} second value
 * @param drawDoneCb {Function} callback when animation finished
 * @return {Number} the result
 */
async function mult(ctx, a, b, drawDoneCb) {
    const vals = preCalcValues(ctx);
    const cFull = a * b;
    const cDiff = cFull - a;
    const c = fmath.reduce(cFull);
    const duration = 2000;
    let start;

    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        drawGraph(ctx);
        let mult = (timestamp - start) / duration;
        mult = Math.min(mult, 1.0);
        mult = common.easeInOut(mult);
        let diff = mult * cDiff;
        drawDot(vals, a + diff, 'red');

        if (mult >= 1.0) {
            if (drawDoneCb) drawDoneCb(c);
        } else {
            ctx['_frame'] = requestAnimationFrame(step);
        }
    }
    ctx['_frame'] = requestAnimationFrame(step);
    return c;
}

/**
 * Run the "addition and subtraction" demo
 * @param ctx {CanvasRenderingContext2D}
 * @param doneCb {Function?} callback every cycle
 */
function runAddSubDemo(ctx, doneCb) {
    const vals = preCalcValues(ctx);
    let r = (a) => {
        if (Math.random() < 0.7) {
            const min = fmath.p - a;
            const max = fmath.p - 1;
            return fmath.reduce(Math.floor(Math.random() * (max - min)) + min);
        } else {
            const max = fmath.p;
            const min = a;
            return -(Math.ceil(Math.random() * (max - min)) + min);
        }
    };
    let a = Math.abs(r(0)), b = r(a);
    let cycle = () => {
        const s = (x) => { return Math.sign(x) > 0 ? '+' : '-' };
        writeLabel(ctx, vals, `${a} ${s(b)} ${Math.abs(b)} = ${a+b} % ${fmath.p} = ${fmath.reduce(a+b)}`);
        addSub(ctx, a, b, (c) => {
            if (doneCb) doneCb(a, b, c);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                a = c;
                b = r(a);
                ctx['_timeout'] = setTimeout(cycle, 2000);
            } else {
                ctx.canvas.click();
            }
        });
    };
    cycle();
}

/**
 * Run the "multiplication" demo
 * @param ctx {CanvasRenderingContext2D}
 * @param doneCb {Function?} callback every cycle
 */
function runMultDemo(ctx, doneCb) {
    const vals = preCalcValues(ctx);
    let r = () => { return Math.ceil(Math.random() * (fmath.p-2)) + 2 };
    let a = r(), b = r();
    let cycle = () => {
        writeLabel(ctx, vals, `${a} ${TIMES_STR} ${b} = ${a*b} % ${fmath.p} = ${fmath.reduce(a*b)}`);
        mult(ctx, a, b, (c) => {
            if (doneCb) doneCb(a, b, c);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                a = r();
                b = r();
                ctx['_timeout'] = setTimeout(cycle, 2000);
            } else {
                ctx.canvas.click();
            }
        });
    };
    cycle();
}

/**
 * Run the "division" demo
 * @param ctx {CanvasRenderingContext2D}
 * @param doneCb {Function?} callback every cycle
 */
function runDivDemo(ctx, doneCb) {
    const vals = preCalcValues(ctx);
    let a, b;
    let refresh = () => {
        a = Math.ceil(Math.random() * (fmath.p-1));
        b = fmath.inverseOf(a);
    };
    let cycle = () => {
        refresh();
        writeLabel(ctx, vals, `${a} ${TIMES_STR} ${b} = ${a*b} % ${fmath.p} ` +
            `= ${fmath.reduce(a*b)}, therefore ${a}${INV_STR} is ${b}`);
        mult(ctx, a, b, (c) => {
            if (doneCb) doneCb(a, b, c);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                ctx['_timeout'] = setTimeout(cycle, 3000);
            } else {
                ctx.canvas.click();
            }
        });
    };
    cycle();
}

/**
 * Run the "square root" demo
 * @param ctx {CanvasRenderingContext2D}
 * @param doneCb {Function?} callback every cycle
 */
function runSqrtDemo(ctx, doneCb) {
    const vals = preCalcValues(ctx);
    let a, b;
    let refresh = () => {
        let lastA = a;
        while (a === lastA || !b) {
            a = Math.floor(Math.random() * (fmath.p));
            const bs = fmath.sqrt(a);
            b = bs ? bs[Math.random() < 0.5 ? 0 : 1] : undefined;
        }
    };
    let cycle = () => {
        refresh();
        writeLabel(ctx, vals, `${b} ${TIMES_STR} ${b} = ${b*b} % ${fmath.p} ` +
            `= ${fmath.reduce(b*b)}, therefore ${b} is a square root of ${a}`);
        mult(ctx, b, b, () => {
            if (doneCb) doneCb(a, b);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                ctx['_timeout'] = setTimeout(cycle, 3000);
            } else {
                ctx.canvas.click();
            }
        });
    };
    cycle();
}

function cancelDemo(ctx) {
    if (ctx['_timeout']) {
        clearTimeout(ctx['_timeout']);
        ctx['_timeout'] = null;
    }
    if (ctx['_frame']) {
        cancelAnimationFrame(ctx['_frame']);
        ctx['_frame'] = null;
    }
}

export {
    runAddSubDemo,
    runMultDemo,
    runDivDemo,
    runSqrtDemo,
    cancelDemo,
};
