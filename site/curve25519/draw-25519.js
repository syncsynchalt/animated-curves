import * as curve from './curve-25519.js';
import * as field from './field-25519.js';
import * as common from '../common.js';

const TWO_PI = 2*Math.PI;

/** @param ctx {CanvasRenderingContext2D} */
function preCalcValues(ctx) {
    const ratio = ctx.canvas['_ratio'] || 1;
    const labelSpace = 26;
    const marginWide = 16;
    const marginThin = 10;
    const dotRadius = 2.5;
    const w = ctx.canvas.getBoundingClientRect().width;
    const h = ctx.canvas.getBoundingClientRect().height;
    const fieldW = BigInt(ctx.canvas.getBoundingClientRect().width - marginWide - marginThin);
    const fieldH = BigInt(ctx.canvas.getBoundingClientRect().height - marginThin - marginWide - labelSpace);
    return {
        ctx, ratio, labelSpace, marginWide, marginThin, w, h, fieldW, fieldH, dotRadius
    };
}

/**
 * Given an x,y point in the field Fp return the coordinates transformed for the JS Canvas context
 * (adjusted for top-left origin and half-pixel anti-aliasing)
 *
 * @param vals {PreCalcVals}
 * @param x {BigInt} between 0 and p
 * @param y {BigInt} between 0 and p
 * @param halfPixel {Boolean?} if set, round all pixels to nearest .5 (true) or .0 (false)
 * @return {Number[2]} x,y values transformed for canvas context
 */
function pointToCtx(vals, x, y, halfPixel) {
    const xRat = Number((vals.fieldW * x) / field.p);
    const yRat = Number((vals.fieldH * y) / field.p);
    let v = [vals.marginWide + xRat, vals.h - vals.labelSpace - vals.marginWide - yRat];
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

async function resetGraph(ctx, vals) {
    if (!vals) {
        vals = preCalcValues(ctx);
    }
    const canvas = ctx.canvas;
    const ratio = vals.ratio;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio - vals.labelSpace);
    drawGrid(ctx);
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
 * @param vals {PreCalcVals}
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
    ctx.arc(...pointToCtx(vals, x, y), vals.dotRadius + (radiusAdj || 0), 0, TWO_PI);
    if (lineWidth !== 0) {
        ctx.stroke();
    }
    ctx.fill();
    ctx.restore();
}

/**
 * Label the point NP.
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {PreCalcVals}
 * @param n {Number}
 * @param x {BigInt}
 * @param y {BigInt}
 */
function labelPoint(ctx, vals, n, x, y) {
    const p = pointToCtx(vals, x, y);
    // use a cache to keep the point label locations stable
    ctx['_pointDirCache'] = ctx['_pointDirCache'] || {};
    const dir = ctx['_pointDirCache'][n] || common.pickLabelDirection(ctx, p[0], p[1]);
    ctx['_pointDirCache'][n] = dir;
    ctx.fillStyle = 'black';
    ctx.font = '14px sans';
    ctx.textAlign = dir[0] === -1 ? 'right' : 'left';
    ctx.textBaseline = dir[1] === -1 ? 'bottom' : 'top';
    ctx.fillText(`${n === 1 ? '' : n}P`, p[0]+2*dir[0], p[1]+4*dir[1]);
    ctx.restore();
}

/**
 * Write the coordinates of the resulting point on the graph.
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {PreCalcVals}
 * @param x {BigInt}
 * @param y {BigInt}
 */
function writeCoordinates(ctx, vals, x, y) {
    const wipeHeight = 32;
    const wipeWidth = (vals.w - 80);
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect((vals.w - wipeWidth) / 2, vals.h - wipeHeight, wipeWidth, wipeHeight);
    ctx.font = '10px monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'black';
    /** @param n {BigInt} */
    let padHex = (n) => {
        return '0x' + n.toString(16).padStart(64, '0');
    };
    ctx.fillText(`x=${padHex(x)}`, 42, vals.h - 22);
    ctx.fillText(`y=${padHex(y)}`, 42, vals.h - 8);
    ctx.restore();
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param n {Number} the NP of current point 'Q'
 * @param Q {BigPoint} the current point 'Q', to which 'P' will be added
 * @param drawDoneCb {Function?} optional callback when done drawing
 */
async function addP(ctx, n, Q, drawDoneCb) {
    const vals = preCalcValues(ctx);
    await resetGraph(ctx, vals);
    let start, prev;

    const P = curve.P();
    if (Q === undefined) {
        Q = P;
    }
    const R = curve.add(P, Q);

    const started = {};
    const finished = {};
    const duration = {
        migrate: 500,
    };
    let lastMidDot;

    let markState = (state, timestamp) => {
        started[state] = started[state] || timestamp;
        return timestamp - started[state];
    };

    writeCoordinates(ctx, vals, Q.x, Q.y);

    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            ctx.beginPath();
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
                labelPoint(ctx, vals, n+1, R.x, R.y);
                writeCoordinates(ctx, vals, R.x, R.y);
                finished.done = timestamp;
            }
            ctx.restore();
        }
        prev = timestamp;

        if (finished.done) {
            drawDoneCb(n+1, R);
        } else {
            ctx['_frame'] = requestAnimationFrame(step);
        }
    }
    ctx['_frame'] = requestAnimationFrame(step);
    return R;
}

/**
 * @param ctx
 * @param updateCb {Function?} callback to run after each point is calculated (before animation)
 * @param drawDoneCb {Function?} callback to run after animation is finished
 * @param n {Number?} optional starting number
 * @param Q {BigPoint?} optional starting point
 */
async function runDemo(ctx, updateCb, drawDoneCb, n, Q) {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    let next = async () => {
        Q = await addP(ctx, n, Q, (nR, R) => {
            n = nR;
            Q = R;
            if (drawDoneCb) drawDoneCb(R);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                ctx['_timeout'] = setTimeout(() => { next() }, .5 * 1000);
                return true;
            } else {
                ctx.canvas.click();
                return false;
            }
        });
        if (updateCb) updateCb(Q);
    };
    await next();
}

const P = curve.P();

export {
    P,
    runDemo,
};
