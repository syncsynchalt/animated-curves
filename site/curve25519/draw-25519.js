import * as curve from './curve-25519.js';
import * as field from './field-25519.js';
import * as common from '../common.js';
import * as misc from './misc-25519.js';

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
 * @param x {BigInt|Number} between 0 and p
 * @param y {BigInt|Number} between 0 and p
 * @param halfPixel {Boolean?} if set, round all pixels to nearest .5 (true) or .0 (false)
 * @return {Number[2]} x,y values transformed for canvas context
 */
function pointToCtx(vals, x, y, halfPixel) {
    x = BigInt(x);
    y = BigInt(y);
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
    ctx.moveTo(...pointToCtx(vals, 0, 0, true));
    ctx.lineTo(...pointToCtx(vals, field.p, 0, true));
    ctx.moveTo(...pointToCtx(vals, 0, 0, true));
    ctx.lineTo(...pointToCtx(vals, 0, field.p, true));
    ctx.stroke();
    ctx.restore();
};

let drawAxisLabels = (ctx, vals) => {
    ctx.save();
    ctx.beginPath();
    ctx.font = 'italic 12px serif';
    ctx.fillStyle = 'black';
    const bodge = 5 * 2**247;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('p', ...pointToCtx(vals, -bodge, field.p, false));
    ctx.fillText('0', ...pointToCtx(vals, -bodge, -2 * bodge, false));
    ctx.fillText('p', ...pointToCtx(vals, field.p, -2 * bodge, false));
    ctx.restore();
};

let drawArrowHeads = (ctx, vals) => {
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    const arrLen = 10;
    const arrWid = 5;
    const xHead = pointToCtx(vals, field.p, 0, true);
    ctx.beginPath();
    ctx.moveTo(...xHead);
    ctx.lineTo(...[xHead[0]-arrLen, xHead[1]-arrWid]);
    ctx.lineTo(...[xHead[0]-arrLen/2, xHead[1]]);
    ctx.lineTo(...[xHead[0]-arrLen, xHead[1]+arrWid]);
    ctx.closePath();
    ctx.fill();

    const yHead = pointToCtx(vals, 0, field.p, true);
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
 * @param x {BigInt|Number} coordinate
 * @param y {BigInt|Number} coordinate
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
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';
    ctx.font = '14px sans';
    ctx.textAlign = dir[0] === -1 ? 'right' : 'left';
    ctx.textBaseline = dir[1] === -1 ? 'bottom' : 'top';
    const tx = p[0]+2*dir[0], ty = p[1]+4*dir[1];
    ctx.strokeText(`${n === 1 ? '' : n}P`, tx, ty);
    ctx.fillText(`${n === 1 ? '' : n}P`, tx, ty);
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
    const negR = curve.negate(R);
    const slopNR = misc.convertToPoint(negR);
    const negLength = Number(negR.y - R.y);
    // noinspection JSUnusedLocalSymbols
    const [_primLeft, primRight] = misc.primaryLineEdges(P, Q);
    // noinspection JSUnusedLocalSymbols
    const [secLeft, _secRight] = misc.secondaryLineEdges(P, Q, negR);
    const slopP = misc.convertToPoint(P);
    const primX = (primRight.x - Number(P.x));
    const secX = (Number(R.x) - secLeft.x);
    const totX = primX + secX;
    const primRatio = primX / totX;

    const started = {};
    const finished = {};
    const duration = {
        line: 500,
        linePause: 100,
        negate: 300,
        done: 100,
    };
    let lastDot;

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
            if (!finished.label) {
                markState('label', timestamp);
                drawDot(vals, Q.x, Q.y, 'black');
                labelPoint(ctx, vals, n, Q.x, Q.y);
                finished.label = timestamp;
            } else if (!finished.line) {
                let instate = markState('line', timestamp);
                ctx.beginPath();
                let mult = instate / duration.line;
                mult = common.easeInOut(mult);
                let dot;
                if (mult < primRatio) {
                    const primMult = mult / primRatio;
                    dot = {
                        x: slopP.x + primMult * (primRight.x - slopP.x),
                        y: slopP.y + primMult * (primRight.y - slopP.y),
                    };
                } else {
                    const secMult = (mult - primRatio) / (1 - primRatio);
                    dot = {
                        x: secLeft.x + secMult * (slopNR.x - secLeft.x),
                        y: secLeft.y + secMult * (slopNR.y - secLeft.y),
                    };
                }
                if (lastDot) {
                    // overdraw old point to clear it
                    drawDot(vals, lastDot.x, lastDot.y, 'white', 0, 2, 'white');
                    drawAxisLines(ctx, vals);
                    labelPoint(ctx, vals, n, Q.x, Q.y);
                }
                drawDot(vals, Q.x, Q.y, 'black');
                drawDot(vals, dot.x, dot.y, 'gray', 0, 0);
                lastDot = dot;

                if (instate > duration.line) {
                    drawDot(vals, negR.x, negR.y, 'red');
                    finished.line = timestamp;
                }
            } else if (!finished.linePause) {
                // xxx consider getting rid of
                let instate = markState('linePause', timestamp);
                if (instate > duration.linePause) {
                    finished.linePause = timestamp;
                }
            } else if (!finished.negate) {
                let instate = markState('negate', timestamp);
                let mult = instate / duration.negate;
                mult = common.easeInOut(mult);

                if (lastDot) {
                    // overdraw old point to clear it
                    drawDot(vals, lastDot.x, lastDot.y, 'white', 0, 2, 'white');
                    drawAxisLines(ctx, vals);
                    labelPoint(ctx, vals, n, Q.x, Q.y);
                }
                drawDot(vals, slopNR.x, slopNR.y, 'red', 0, 0);
                const dot = {x: slopNR.x, y: slopNR.y - negLength * mult};
                drawDot(vals, dot.x, dot.y, 'red');
                lastDot = dot;

                if (instate > duration.negate) {
                    finished.negate = timestamp;
                    drawDot(vals, slopNR.x, slopNR.y, 'white', 1, 0);
                    drawDot(vals, R.x, R.y, 'red', 0.5);
                    labelPoint(ctx, vals, n+1, R.x, R.y);
                    writeCoordinates(ctx, vals, R.x, R.y);
                }
            } else if (!finished.done) {
                let instate = markState('done', timestamp);
                if (instate > duration.done) {
                    finished.done = timestamp;
                }
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
            } else {
                ctx.canvas.click();
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
