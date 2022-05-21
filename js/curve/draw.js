import * as curve from './curve.js';
import * as field from './field.js';
import * as misc from './draw-misc.js';
const TWO_PI = 2*Math.PI;
const EPS = 0.0000001;

function preCalcValues(ctx) {
    const marginWide = 29.5;
    const marginThin = 14.5;
    const dotRadius = 3;
    const w = ctx.canvas.getBoundingClientRect().width;
    const h = ctx.canvas.getBoundingClientRect().height;
    return {
        ctx, marginWide, marginThin, w, h, dotRadius,
        wScale: (w-marginWide-marginThin)/field.p,
        hScale: (h-marginWide-marginThin)/field.p
    };
}

/**
 * Given an x,y point in the field Fp return the coordinates transformed for the JS Canvas context
 * (adjusted for top-left origin and half-pixel anti-aliasing)
 *
 * @param vals {Object} values from preCalcValues(ctx)
 * @param x {Number} between 0 and p
 * @param y {Number} between 0 and p
 * @return {Number[2]} x,y values transformed for canvas context
 */
function pointToCtx(vals, x, y) {
    return [vals.marginWide+x*vals.wScale, vals.h - (vals.marginWide+y*vals.hScale)];
}

let drawGreyLines = (ctx, vals) => {
    // draw the grey lines
    const greyWidth = 5;
    ctx.strokeStyle = 'lightgrey';
    for (let i = greyWidth; i < field.p; i += greyWidth) {
        ctx.setLineDash([]);
        ctx.beginPath();
        if (i % 10 !== 0) {
            ctx.setLineDash([2, 2]);
        }
        ctx.moveTo(...pointToCtx(vals, 0, i));
        ctx.lineTo(...pointToCtx(vals, field.p, i));
        ctx.stroke();
        ctx.moveTo(...pointToCtx(vals, i, 0));
        ctx.lineTo(...pointToCtx(vals, i, field.p));
        ctx.stroke();
    }
};

let drawAxisLines = (ctx, vals) => {
    // draw the axis lines
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(...pointToCtx(vals, 0, 0));
    ctx.lineTo(...pointToCtx(vals, field.p - 0.5, 0));
    ctx.stroke();
    ctx.moveTo(...pointToCtx(vals, 0, 0));
    ctx.lineTo(...pointToCtx(vals, 0, field.p - 0.5));
    ctx.stroke();
};

let drawArrowHeads = (ctx, vals) => {
    // draw the arrows
    ctx.strokeStyle = 'black';
    const arrLen = 10;
    const arrWid = 5;
    const xHead = pointToCtx(vals, field.p, 0);
    ctx.beginPath();
    ctx.moveTo(...xHead);
    ctx.lineTo(...[xHead[0]-arrLen, xHead[1]-arrWid]);
    ctx.lineTo(...[xHead[0]-arrLen/2, xHead[1]]);
    ctx.lineTo(...[xHead[0]-arrLen, xHead[1]+arrWid]);
    ctx.closePath();
    ctx.fill();

    const yHead = pointToCtx(vals, 0, field.p);
    ctx.beginPath();
    ctx.moveTo(...yHead);
    ctx.lineTo(...[yHead[0]-arrWid, yHead[1]+arrLen]);
    ctx.lineTo(...[yHead[0], yHead[1]+arrLen/2]);
    ctx.lineTo(...[yHead[0]+arrWid, yHead[1]+arrLen]);
    ctx.closePath();
    ctx.fill();
};

function reset(ctx) {
    if (animationFrameInProgress) {
        cancelAnimationFrame(animationFrameInProgress);
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx);
    drawCurve(ctx);
}

/**
 * Draw a grid for Fp in the given 2d canvas context.
 *
 * @param ctx {CanvasRenderingContext2D}
 */
function drawGrid(ctx) {
    const vals = preCalcValues(ctx);
    ctx.lineWidth = 1;

    drawGreyLines(ctx, vals);
    drawAxisLines(ctx, vals);
    drawArrowHeads(ctx, vals);
}

function drawDot(vals, x, y, radius) {
    const ctx = vals.ctx;
    ctx.beginPath();
    ctx.moveTo(...pointToCtx(vals, x, y));
    ctx.arc(...pointToCtx(vals, x, y), radius || vals.dotRadius, 0, TWO_PI);
    ctx.stroke();
    ctx.fill();
}

/**
 * Draw the curve in the given 2d canvas context.
 *
 * @param ctx {CanvasRenderingContext2D}
 */
function drawCurve(ctx) {
    const vals = preCalcValues(ctx);
    const origFill = ctx.fillStyle;
    ctx.fillStyle = 'lightblue';
    for (let x = 0; x < field.p; x++) {
        let yVals = curve.Y(x);
        if (yVals) {
            drawDot(vals, x, yVals[0]);
            drawDot(vals, x, yVals[1]);
        }
    }
    ctx.fillStyle = 'gold';
    let P = curve.P();
    drawDot(vals, P.x, P.y);
    ctx.fillStyle = origFill;
}

let animationFrameInProgress;

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param Q {Point} the current point 'Q', to which 'P' will be added
 */
function addP(ctx, Q) {
    if (animationFrameInProgress) {
        reset(ctx);
    }
    const vals = preCalcValues(ctx);
    let start, prev;

    const P = curve.P();
    if (!Q) {
        Q = P;
    }
    const R = curve.pointAdd(P, Q);
    const negR = curve.negate(R);

    const started = {};
    const finished = {};
    const duration = {
        tangent: 500,
        tanPause: 300,
        line: 1000,
        linePause: 300,
        negate: 1000,
        done: 1000,
    };
    const slope = misc.getSlope(P, Q);
    const cache = {};

    ctx.fillStyle = 'orange';
    drawDot(vals, Q.x, Q.y);

    function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        let elapsed = timestamp - start;
        if (timestamp !== prev) {
            ctx.save();
            if (!finished['tangent']) {
                started.tangent = started.tangent || timestamp;
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'orange';
                ctx.setLineDash([4, 4]);
                let mult = elapsed / duration.tangent;
                let bounds = misc.lineBoxBounds(P, Q);
                let tanLineForw = bounds[1] - Q.x;
                let tanLineBack = Q.x - bounds[0];
                tanLineForw *= mult;
                tanLineBack *= mult;
                ctx.moveTo(...pointToCtx(vals, Q.x, Q.y));
                ctx.lineTo(...pointToCtx(vals, Q.x + Math.abs(tanLineForw),
                    Q.y + tanLineForw * slope));
                ctx.moveTo(...pointToCtx(vals, Q.x, Q.y));
                ctx.lineTo(...pointToCtx(vals, Q.x - Math.abs(tanLineBack),
                    Q.y - tanLineBack * slope));
                ctx.stroke();
                if (elapsed > duration.tangent) {
                    finished.tangent = timestamp;
                }
            } else if (!finished.tanPause) {
                started.tanPause = started.tanPause || timestamp;
                if (timestamp - started.tanPause > duration.tanPause) {
                    finished.tanPause = timestamp;
                }
            } else if (!finished.line) {
                started.line = started.line || timestamp;
                if (!cache.lineLast) {
                    let _x;
                    // noinspection JSUnusedAssignment
                    [cache.lineLast, _x] = misc.orderPointsByX(P, Q);
                    cache.lineXLeft = misc.findTotalXLength(P, Q, negR);
                    cache.lineXPerMs = cache.lineXLeft / duration.line || 1;
                }

                ctx.lineWidth = 2;
                ctx.strokeStyle = 'orange';
                ctx.setLineDash([]);
                let todoX = Math.min(cache.lineXPerMs * (timestamp - prev), cache.lineXLeft);
                let check = 10;
                while (todoX > 0) {
                    if (check-- < 0) break;
                    ctx.beginPath();
                    ctx.moveTo(...pointToCtx(vals, cache.lineLast.x, cache.lineLast.y));
                    let next = misc.findWrapSegment(cache.lineLast, slope, todoX);
                    ctx.lineTo(...pointToCtx(vals, next.x, next.y));
                    ctx.stroke();

                    let drawnX = next.x - cache.lineLast.x;
                    if (next.y < EPS) {
                        next.y += field.p;
                    } else if (next.y > field.p - EPS) {
                        next.y -= field.p;
                    }
                    if (next.x > field.p - EPS) {
                        next.x -= field.p;
                    }
                    cache.lineLast = next;
                    cache.lineXLeft -= drawnX;
                    todoX -= drawnX;
                }
                if (cache.lineXLeft <= EPS) {
                    finished.line = timestamp;
                    ctx.save();
                    ctx.fillStyle = 'orange';
                    ctx.strokeStyle = 'black';
                    drawDot(vals, negR.x, negR.y, 3);
                    ctx.restore();
                }
            } else if (!finished.linePause) {
                started.linePause = started.linePause || timestamp;
                if (timestamp - started.linePause >= duration.linePause) {
                    finished.linePause = timestamp;
                }
            } else if (!finished.negate) {
                started.negate = started.negate || timestamp;
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'orange';
                ctx.setLineDash([3, 3]);
                if (!cache.negateLength) {
                    cache.negateLength = curve.negate(R).y - R.y;
                }
                let mult = (timestamp - started.negate) / duration.negate;
                mult = Math.min(1, mult);
                ctx.moveTo(...pointToCtx(vals, negR.x, negR.y));
                ctx.lineTo(...pointToCtx(vals, negR.x, negR.y - cache.negateLength * mult));
                ctx.stroke();
                if (mult === 1.0) {
                    ctx.setLineDash([]);
                    ctx.strokeStyle = 'black';
                    ctx.fillStyle = 'red';
                    drawDot(vals, R.x, R.y, 5);
                    finished.negate = timestamp;
                }
            } else if (!finished.done) {
                started.done = started.done || timestamp;
                if (timestamp - started.done > duration.done) {
                    finished.done = timestamp;
                }
            }
            ctx.restore();
        }
        prev = timestamp;

        if (finished.done) {
            reset(ctx);
            ctx.save();
            ctx.fillStyle = 'red';
            drawDot(vals, R.x, R.y);
            ctx.restore();
        } else {
            animationFrameInProgress = requestAnimationFrame(step);
        }
    }
    if (animationFrameInProgress) {
        cancelAnimationFrame(animationFrameInProgress);
    }
    animationFrameInProgress = requestAnimationFrame(step);
    return R;
}

export {
    reset,
    drawGrid,
    drawCurve,
    addP,
};
