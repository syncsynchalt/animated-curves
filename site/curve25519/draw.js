import * as curve from './curve.js';
import * as field from './field.js';
import * as common from '../common.js';

const TWO_PI = 2*Math.PI;

function preCalcValues(ctx) {
    const marginWide = 20;
    const marginThin = 10;
    const dotRadius = 2.5;
    const w = ctx.canvas.getBoundingClientRect().width;
    const h = ctx.canvas.getBoundingClientRect().height;
    const fieldW = BigInt(ctx.canvas.getBoundingClientRect().width - marginWide - marginThin);
    const fieldH = BigInt(ctx.canvas.getBoundingClientRect().height - marginWide - marginThin);
    return {
        ctx, marginWide, marginThin, w, h, fieldW, fieldH, dotRadius
    };
}

/**
 * Given an x,y point in the field Fp return the coordinates transformed for the JS Canvas context
 * (adjusted for top-left origin and half-pixel anti-aliasing)
 *
 * @param vals {Object} values from preCalcValues(ctx)
 * @param x {BigInt} between 0 and p
 * @param y {BigInt} between 0 and p
 * @param halfPixel {Boolean?} if set, round all pixels to nearest .5 (true) or .0 (false)
 * @return {Number[2]} x,y values transformed for canvas context
 */
function pointToCtx(vals, x, y, halfPixel) {
    const xRat = Number((vals.fieldW * x) / field.p);
    const yRat = Number((vals.fieldH * y) / field.p);
    let v = [vals.marginWide + xRat, vals.h - (vals.marginWide + yRat)];
    if (halfPixel) {
        v[0] = ((v[0]+0.5) | 0) - 0.5;
        v[1] = ((v[1]+0.5) | 0) - 0.5;
    } else if (halfPixel === false) {
        v[0] = ((v[0]+0.5) | 0);
        v[1] = ((v[1]+0.5) | 0);
    }
    return v;
}

let drawAxisLines = (ctx, vals) => {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(...pointToCtx(vals, 0n, 0n, true));
    ctx.lineTo(...pointToCtx(vals, field.p, 0n, true));
    ctx.moveTo(...pointToCtx(vals, 0n, 0n, true));
    ctx.lineTo(...pointToCtx(vals, 0n, field.p, true));
    ctx.stroke();
    ctx.restore();
};

let drawAxisLabels = (ctx, vals) => {
    ctx.save();
    ctx.beginPath();
    ctx.font = 'italic 12px serif';
    ctx.fillStyle = 'black';
    const bodge = 5n * 2n**247n;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('p', ...pointToCtx(vals, -bodge, field.p, false));
    ctx.fillText('0', ...pointToCtx(vals, -bodge, -2n * bodge, false));
    ctx.fillText('p', ...pointToCtx(vals, field.p, -2n * bodge, false));
    ctx.restore();
};

let drawArrowHeads = (ctx, vals) => {
    // draw the arrows
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    const arrLen = 10;
    const arrWid = 5;
    const xHead = pointToCtx(vals, field.p, 0n, true);
    ctx.beginPath();
    ctx.moveTo(...xHead);
    ctx.lineTo(...[xHead[0]-arrLen, xHead[1]-arrWid]);
    ctx.lineTo(...[xHead[0]-arrLen/2, xHead[1]]);
    ctx.lineTo(...[xHead[0]-arrLen, xHead[1]+arrWid]);
    ctx.closePath();
    ctx.fill();

    const yHead = pointToCtx(vals, 0n, field.p, true);
    ctx.beginPath();
    ctx.moveTo(...yHead);
    ctx.lineTo(...[yHead[0]-arrWid, yHead[1]+arrLen]);
    ctx.lineTo(...[yHead[0], yHead[1]+arrLen/2]);
    ctx.lineTo(...[yHead[0]+arrWid, yHead[1]+arrLen]);
    ctx.closePath();
    ctx.fill();
};

let resetSaveState = null;

async function resetGraph(ctx) {
    if (animationFrameInProgress) {
        cancelAnimationFrame(animationFrameInProgress);
        setAnimationFrame(() => { return null });
    }
    const canvas = ctx.canvas;
    if (resetSaveState) {
        const ratio = canvas._ratio || 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = resetSaveState;
        ctx.drawImage(img, 0, 0, img.width, img.height,
            0, 0, canvas.width / ratio, canvas.height / ratio);
        return {'usedCache': true};
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx);
        canvas.toBlob(blob => {
            let img = new Image();
            img.addEventListener('load', () => {
                resetSaveState = img;
            });
            img.src = URL.createObjectURL(blob);
        }, 'image/png');
        return {'usedCache': false};
    }
}

/**
 * Draw a grid for Fp in the given 2d canvas context.
 *
 * @param ctx {CanvasRenderingContext2D}
 */
function drawGrid(ctx) {
    const vals = preCalcValues(ctx);
    ctx.lineWidth = 1;

    drawAxisLines(ctx, vals);
    drawAxisLabels(ctx, vals);
    drawArrowHeads(ctx, vals);
}

/**
 * @param vals {Object} return from cacheVals
 * @param x {BigInt} coordinate
 * @param y {BigInt} coordinate
 * @param color {String} fill style
 * @param radiusAdj {Number?} adjustment to built-in dot radius
 * @param lineWidth {Number?} line width
 * @param strokeStyle {String?} stroke style
 */
function drawDot(vals, x, y, color,
    radiusAdj, lineWidth, strokeStyle) {
    const ctx = vals.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = strokeStyle || 'black';
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth !== undefined ? lineWidth : 1;
    ctx.moveTo(...pointToCtx(vals, x, y));
    ctx.arc(...pointToCtx(vals, x, y), vals.dotRadius + (radiusAdj || 0), 0, TWO_PI);
    if (lineWidth !== 0) {
        ctx.stroke();
    }
    ctx.fill();
    ctx.restore();
}

/**
 * @param func {Function} function to set or clear animation frame value
 */
let setAnimationFrame = (func) => {
    if (animationFrameInProgress) {
        cancelAnimationFrame(animationFrameInProgress);
    }
    animationFrameInProgress = func();
};

let animationFrameInProgress;

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param Q {BigPoint} the current point 'Q', to which 'P' will be added
 * @param drawDoneCb {Function?} optional callback when done drawing
 */
async function addP(ctx, Q, drawDoneCb) {
    await resetGraph(ctx);
    const vals = preCalcValues(ctx);
    let start, prev;

    const P = curve.P();
    if (Q === undefined) {
        Q = P;
    }
    const R = curve.add(P, Q);

    const started = {};
    const finished = {};
    const duration = {
        migrate: 700,
    };
    let lastMidDot;

    let markState = (state, timestamp) => {
        started[state] = started[state] || timestamp;
        return timestamp - started[state];
    };

    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            ctx.save();
            if (!finished['migrate']) {
                let instate = markState('migrate', timestamp);
                ctx.beginPath();
                if (lastMidDot) {
                    // overdraw last orange dot
                    drawDot(vals, lastMidDot.x, lastMidDot.y, 'white', 0, 2, 'white');
                    drawAxisLines(ctx, vals);
                }
                let mult = instate / duration.migrate;
                mult = Math.min(1.0, mult);
                mult = common.easeInOut(mult);
                let fw = R.x - Q.x;
                let up = R.y - Q.y;
                fw = BigInt(Number(fw) * mult);
                up = BigInt(Number(up) * mult);
                const midDot = {x: Q.x + fw, y: Q.y + up};
                drawDot(vals, midDot.x, midDot.y, 'orange', 0, 0);
                lastMidDot = midDot;
                if (instate > duration.migrate) {
                    finished.migrate = timestamp;
                }
            } else if (!finished.done) {
                markState('done', timestamp);
                drawDot(vals, R.x, R.y, 'red', 0.5);
                finished.done = timestamp;
            }
            ctx.restore();
        }
        prev = timestamp;

        if (finished.done) {
            drawDoneCb(R);
        } else {
            setAnimationFrame(() => { return requestAnimationFrame(step) });
        }
    }
    setAnimationFrame(() => { return requestAnimationFrame(step) });
    return R;
}

let demoTimeout = null;

/**
 * @param ctx
 * @param updateCb {Function?} callback to run after each point is calculated (before animation)
 * @param drawDoneCb {Function?} callback to run after animation is finished
 * @param Q {BigPoint?} optional starting point
 */
async function runDemo(ctx, updateCb, drawDoneCb, Q) {
    let next = async () => {
        Q = await addP(ctx, Q, (R) => {
            if (drawDoneCb) drawDoneCb(R);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                demoTimeout = setTimeout(() => { next() }, .7 * 1000);
                return true;
            } else {
                cancelDemo();
                common.addPlayMask(ctx, () => {
                    runDemo(ctx, updateCb, drawDoneCb, Q);
                });
                return false;
            }
        });
        if (updateCb) updateCb(Q);
    };
    await next();
}

function cancelDemo() {
    if (demoTimeout) {
        clearTimeout(demoTimeout);
        demoTimeout = null;
    }
    setAnimationFrame(() => { return null });
}

const P = curve.P();

export {
    P,
    resetGraph,
    addP,
    runDemo,
    cancelDemo,
};
