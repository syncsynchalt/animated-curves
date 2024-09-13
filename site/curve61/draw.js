import * as curve from './curve.js';
import * as field from './field.js';
import * as misc from './draw-misc.js';
import * as common from '../common.js';

const TWO_PI = 2*Math.PI;
const EPS = 0.0000001;
const INFINITY = '\u221E';

function P() {
    return curve.P();
}

/** @typedef PreCalcVals {Object} */

/**
 * @param ctx {CanvasRenderingContext2D}
 * @return {PreCalcVals}
 */
function preCalcValues(ctx) {
    const marginWide = 25;
    const marginThin = 14;
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
 * @param vals {PreCalcVals}
 * @param x {Number} between 0 and p
 * @param y {Number} between 0 and p
 * @param halfPixel {Boolean?} if set, round all pixels to nearest .5 (true) or .0 (false)
 * @return {Number[2]} x,y values transformed for canvas context
 */
function pointToCtx(vals, x, y, halfPixel) {
    let v = [vals.marginWide + x*vals.wScale, vals.h - (vals.marginWide + y*vals.hScale)];
    if (halfPixel) {
        v[0] = ((v[0]+0.5) | 0) - 0.5;
        v[1] = ((v[1]+0.5) | 0) - 0.5;
    } else if (halfPixel === false) {
        v[0] = ((v[0]+0.5) | 0);
        v[1] = ((v[1]+0.5) | 0);
    }
    return v;
}

let drawGreyLines = (ctx, vals) => {
    const greyWidth = 5;
    ctx.strokeStyle = 'lightgrey';
    [field.p/2, field.p].forEach(y => {
        ctx.setLineDash([]);
        ctx.beginPath();
        if (y !== field.p) {
            ctx.setLineDash([2, 2]);
        }
        ctx.moveTo(...pointToCtx(vals, 0, y, true));
        ctx.lineTo(...pointToCtx(vals, field.p-1, y, true));
        ctx.stroke();
    });
    for (let i = greyWidth; i < field.p; i += greyWidth) {
        ctx.setLineDash([]);
        ctx.beginPath();
        if (i % 10 !== 0) {
            ctx.setLineDash([2, 2]);
        }
        ctx.moveTo(...pointToCtx(vals, i, 0, true));
        ctx.lineTo(...pointToCtx(vals, i, field.p, true));
        ctx.stroke();
    }
};

let drawAxisLines = (ctx, vals) => {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(...pointToCtx(vals, 0, 0, true));
    ctx.lineTo(...pointToCtx(vals, field.p, 0, true));
    ctx.moveTo(...pointToCtx(vals, 0, 0, true));
    ctx.lineTo(...pointToCtx(vals, 0, field.p, true));
    ctx.stroke();
    ctx.font = 'italic 12px serif';
    ctx.fillStyle = 'black';
    const yBodge = 12 / vals.hScale;
    [10, 20, 30, 40, 50].forEach(x => {
        ctx.fillText(x, ...pointToCtx(vals, x-1, -yBodge));
    });
    ctx.fillText('p', ...pointToCtx(vals, field.p - 0.5, -yBodge, false));
    ctx.textAlign = 'right';
    const xBodge = 4 / vals.wScale;
    ctx.fillText('0', ...pointToCtx(vals, -xBodge, -yBodge, false));
    ctx.fillText('p', ...pointToCtx(vals, -xBodge, field.p - 0.5, false));
    ctx.fillText('p/2', ...pointToCtx(vals, -xBodge, field.p/2 - 0.5, false));
    ctx.restore();
};

let drawArrowHeads = (ctx, vals) => {
    // draw the arrows
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

/**
 * Reset the graph to the "base" state.
 * @param ctx {CanvasRenderingContext2D}
 * @param drawPoints {Boolean?} whether to also draw the curve points (default false).
 *      Note that the value of drawPoints is cached after first call.
 */
function resetGraph(ctx, drawPoints) {
    const canvas = ctx.canvas;
    if (ctx['resetState']) {
        common.putCanvasImageState(ctx, ctx['resetState']);
        return {'usedCache': true};
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx);
        if (drawPoints) {
            drawCurve(ctx);
        }
        ctx['resetState'] = common.getCanvasImageState(ctx);
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

    drawGreyLines(ctx, vals);
    drawAxisLines(ctx, vals);
    drawArrowHeads(ctx, vals);
}

/**
 * @param vals {PreCalcVals}
 * @param x {Number} coordinate
 * @param y {Number} coordinate
 * @param color {String} fill style
 * @param radiusAdj {Number?} adjustment to built-in dot radius
 * @param lw {Number?} line width
 */
function drawDot(vals, x, y, color, radiusAdj, lw) {
    const ctx = vals.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'black';
    ctx.fillStyle = color;
    ctx.lineWidth = lw || 1;
    ctx.arc(...pointToCtx(vals, x, y, true), vals.dotRadius + (radiusAdj || 0), 0, TWO_PI);
    if (lw !== 0) {
        ctx.stroke();
    }
    ctx.fill();
    ctx.restore();
}

/**
 * Draw the curve in the given 2d canvas context.
 *
 * @param ctx {CanvasRenderingContext2D}
 */
function drawCurve(ctx) {
    const vals = preCalcValues(ctx);
    ctx.save();
    ctx.fillStyle = 'lightblue';
    for (let x = 0; x < field.p; x++) {
        let yVals = curve.Y(x);
        if (yVals) {
            drawDot(vals, x, yVals[0], 'lightblue');
            drawDot(vals, x, yVals[1], 'lightblue');
        }
    }
    ctx.restore();
}

/**
 * Write a label for the given point.
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {PreCalcVals}
 * @param num {Number} the label to write
 * @param P {Point} the point to label
 * @param options {Object?}
 * @param options.coords {Boolean?} whether to also label the coordinates
 * @param options.label {String?} the label to use for points (default 'P')
 */
function labelPoint(ctx, vals, num, P, options) {
    const baseLabel = options?.label || 'P';
    ctx.save();
    ctx.beginPath();
    const index = `${P.x},${P.y}`;
    const pt = pointToCtx(vals, P.x, P.y);
    // use a cache to keep the point label locations stable
    ctx['_pointDirCache'] = ctx['_pointDirCache'] || {};
    const dir = ctx['_pointDirCache'][index] ||
        common.pickLabelDirection(ctx, pt[0], pt[1], 30);
    ctx['_pointDirCache'][index] = dir;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';
    ctx.font = '14px sans';
    ctx.textAlign = dir[0] === -1 ? 'right' : 'left';
    ctx.textBaseline = dir[1] === -1 ? 'bottom' : 'top';
    ctx.lineWidth = 4;
    const label = num === 1 ? baseLabel : `${num}${baseLabel}`;
    ctx.strokeText(label, pt[0]+3*dir[0], pt[1]+3*dir[1]);
    ctx.fillText(label, pt[0]+3*dir[0], pt[1]+3*dir[1]);

    if (options?.coords) {
        let coordLabel = `(${P.x}, ${P.y})`;
        ctx.font = '12px sans';
        const flipDir = [dir[0]*-1, dir[1]*-1];
        const tw = ctx.measureText(coordLabel).width + 2;
        if (pt[0] < tw || pt[0] > vals.w - tw) flipDir[0] *= -1;
        if (pt[1] < 16 || pt[1] > vals.h - 16) flipDir[1] *= -1;
        ctx.textAlign = flipDir[0] === -1 ? 'right' : 'left';
        ctx.textBaseline = flipDir[1] === -1 ? 'bottom' : 'top';
        ctx.strokeText(coordLabel, pt[0]+3*flipDir[0], pt[1]-3+3*flipDir[1]);
        ctx.fillText(coordLabel, pt[0]+3*flipDir[0], pt[1]-3+3*flipDir[1]);
    }

    ctx.restore();
}

/**
 * Label a series of points on the graph.
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {PreCalcVals}
 * @param points {Object} mapping of label => point to label
 * @param options {Object?}
 * @param {String?} options.label label for base point (default 'P')
 * @param {Boolean?} options.coords whether to label coordinates
 */
function drawAndLabelPoints(ctx, vals, points, options) {
    if (points) {
        for (const [num, point] of Object.entries(points)) {
            drawDot(vals, point.x, point.y, 'black');
            labelPoint(ctx, vals, Number(num), point, options);
        }
    }
}

/**
 * Add two points (visually).
 * @param ctx {CanvasRenderingContext2D}
 * @param nP {Number} the base-P multiple of P (for labeling)
 * @param P {Point}
 * @param nQ {Number} the base-P multiple of Q (for labeling)
 * @param Q {Point}
 * @param options {Object?} optional list of options
 * @param {Object?} options.labels optional list of label:point mappings to label on graph reset
 * @param {Boolean?} options.removeInputs remove each point from options?.labels after adding them
 * @param {String?} options.basePointLabel label to use for base point (default 'P')
 * @param {Boolean?} options.coords whether to label coordinates
 * @param {Boolean?} options.drawPoints whether to draw the points of the curve
 * @param {Function?} options.drawDoneCb called when animation is finished
 * @return {Point} the result of adding P and Q: R
 */
function addPointsAnimation(ctx, nP, P, nQ, Q, options) {
    const vals = preCalcValues(ctx);
    const labelOptions = {coords: options?.coords, label: options?.basePointLabel};
    let start, prev;

    if (Q === undefined) {
        Q = P;
        nQ = nP;
    } else if (Q === null) {
        // reset back to P
        const R = P;
        resetGraph(ctx, options?.drawPoints);
        drawAndLabelPoints(ctx, vals, options?.labels, {label: options?.basePointLabel});
        drawDot(vals, P.x, P.y, 'red');
        // preserve the expected ordering that this function returns, _then_ animation finishes.
        setTimeout(() => {
            if (options?.drawDoneCb) options.drawDoneCb(nP+nQ, R);
        }, 0);
        return P;
    }
    const R = curve.pointAdd(P, Q);
    if (R === null) {
        return drawInfinity(ctx, nP, P, nQ, Q, options, (R) => {
            if (options?.drawDoneCb) options.drawDoneCb(nP+nQ, R);
        });
    }
    const negR = curve.negate(R);
    const slope = misc.getSlope(P, Q);
    const nR = nP + nQ;

    const started = {};
    const finished = {};
    const duration = {
        tangent: 500,
        tanPause: 300,
        line: 500,
        linePause: 500,
        negate: 1000,
        done: 1000,
    };
    const cache = {};

    let markState = (state, timestamp) => {
        started[state] = started[state] || timestamp;
        return timestamp - started[state];
    };

    function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            ctx.beginPath();
            ctx.save();
            if (!finished['label']) {
                markState('label', timestamp);
                labelPoint(ctx, vals, nP, P, labelOptions);
                if (nQ !== nP) {
                    labelPoint(ctx, vals, nQ, Q, labelOptions);
                }
                finished['label'] = timestamp;
            } else if (!finished['tangent']) {
                let instate = markState('tangent', timestamp);
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'orange';
                ctx.setLineDash([4, 4]);
                let mult = instate / duration.tangent;
                mult = common.easeInOut(mult);
                let bounds = misc.lineBoxBounds(P, Q);
                let tanLineForw = bounds[1] - P.x;
                let tanLineBack = P.x - bounds[0];
                tanLineForw *= mult;
                tanLineBack *= mult;
                ctx.moveTo(...pointToCtx(vals, P.x, P.y));
                ctx.lineTo(...pointToCtx(vals, P.x + Math.abs(tanLineForw),
                    P.y + tanLineForw * slope));
                ctx.moveTo(...pointToCtx(vals, P.x, P.y));
                ctx.lineTo(...pointToCtx(vals, P.x - Math.abs(tanLineBack),
                    P.y - tanLineBack * slope));
                ctx.stroke();
                drawDot(vals, P.x, P.y, 'black');
                drawDot(vals, Q.x, Q.y, 'red');
                if (instate > duration.tangent) {
                    finished.tangent = timestamp;
                }
            } else if (!finished.tanPause) {
                let instate = markState('tanPause', timestamp);
                if (instate > duration.tanPause) {
                    finished.tanPause = timestamp;
                }
            } else if (!finished.line) {
                markState('line', timestamp);
                if (!cache.lineLastP) {
                    let _x;
                    // noinspection JSUnusedAssignment
                    [cache.lineLastP, _x] = common.orderPointsByX(P, Q);
                    cache.lineXLeft = misc.findTotalXLength(P, Q, negR);
                    cache.lineXPerMs = cache.lineXLeft / duration.line || 1;
                    cache.segmentBudget = 5;
                }

                ctx.lineWidth = 2;
                ctx.strokeStyle = 'orange';
                ctx.setLineDash([]);
                let todoX = Math.min(cache.lineXPerMs * (timestamp - prev), cache.lineXLeft);
                let check = 10;
                let segmentsLen = 0;
                while (todoX > 0 && segmentsLen < cache.segmentBudget) {
                    if (check-- < 0) {
                        break;
                    }
                    ctx.beginPath();
                    ctx.moveTo(...pointToCtx(vals, cache.lineLastP.x, cache.lineLastP.y));
                    let next = misc.findWrapSegment(cache.lineLastP, slope, todoX,
                        cache.segmentBudget - segmentsLen);
                    ctx.lineTo(...pointToCtx(vals, next.x, next.y));
                    ctx.stroke();
                    segmentsLen += misc.segmentLen(cache.lineLastP, next);

                    let drawnX = next.x - cache.lineLastP.x;
                    if (next.y < EPS) {
                        next.y += field.p;
                        cache.segmentBudget *= 1.1;
                    } else if (next.y > field.p - EPS) {
                        next.y -= field.p;
                        cache.segmentBudget *= 1.1;
                    }
                    if (next.x > field.p - EPS) {
                        next.x -= field.p;
                        cache.segmentBudget *= 1.1;
                    }
                    cache.lineLastP = next;
                    cache.lineXLeft -= drawnX;
                    todoX -= drawnX;
                }
                drawDot(vals, P.x, P.y, 'black');
                drawDot(vals, Q.x, Q.y, 'red');
                if (cache.lineXLeft <= EPS) {
                    finished.line = timestamp;
                    drawDot(vals, negR.x, negR.y, 'orange', +1, 1);
                }
            } else if (!finished.linePause) {
                let instate = markState('linePause', timestamp);
                if (instate >= duration.linePause) {
                    finished.linePause = timestamp;
                }
            } else if (!finished.negate) {
                let instate = markState('negate', timestamp);
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'red';
                ctx.setLineDash([3, 2]);
                if (!cache.negLength) {
                    cache.negLength = negR.y - R.y;
                }
                let mult = instate / duration.negate;
                mult = common.easeInOut(mult);
                ctx.moveTo(...pointToCtx(vals, negR.x, negR.y, true));
                ctx.lineTo(...pointToCtx(vals, negR.x, negR.y - cache.negLength * mult, true));
                ctx.stroke();
                ctx.setLineDash([]);
                // overdraw to fix red line covering this dot
                drawDot(vals, negR.x, negR.y, 'orange', +1, 1);
                labelPoint(ctx, vals, nP, P, labelOptions);
                labelPoint(ctx, vals, nQ, Q, labelOptions);
                if (instate > duration.negate) {
                    ctx.strokeStyle = 'black';
                    drawDot(vals, Q.x, Q.y, 'orange');
                    drawDot(vals, R.x, R.y, 'red', +1, 2);
                    labelPoint(ctx, vals, nP+nQ, R, labelOptions);
                    finished.negate = timestamp;
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
            if (options?.removeInputs && options?.labels) {
                delete options.labels[nP];
                delete options.labels[nQ];
            }
            resetGraph(ctx, options?.drawPoints);
            drawAndLabelPoints(ctx, vals, options?.labels, labelOptions);
            drawDot(vals, R.x, R.y, 'red');
            labelPoint(ctx, vals, nP+nQ, R, labelOptions);
            if (options?.drawDoneCb) {
                options.drawDoneCb(nR, R);
            }
        } else {
            ctx['_frame'] = requestAnimationFrame(step);
        }
    }
    ctx['_frame'] = requestAnimationFrame(step);
    return R;
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param nP {Number} the base-P multiple of P (for labeling)
 * @param P {Point} the current point 'P'
 * @param nQ {Number} the base-P multiple of Q (for labeling)
 * @param Q {Point} the current point 'Q' (assumed has same x-coord as P)
 * @param options {Object?} optional list of options
 * @param drawDoneCb {Function?} optional callback when done drawing
 * @return {Point} the point P + Q (which should always be null (infinity))
 */
function drawInfinity(ctx, nP, P, nQ, Q, options, drawDoneCb) {
    const vals = preCalcValues(ctx);
    const labelOptions = {coords: options?.coords, label: options?.basePointLabel};
    let start, prev;
    const R = null;

    const started = {};
    const finished = {};
    const duration = {
        tangent: 500,
        tanPause: 300,
        line: 500,
        linePause: 300,
        infinite: 1,
        done: 1000,
    };

    let markState = (state, timestamp) => {
        started[state] = started[state] || timestamp;
        return timestamp - started[state];
    };

    let drawFullVertLine = (mult) => {
        ctx.beginPath();
        mult = common.easeInOut(mult);
        let lineUp = (field.p - P.y) * mult;
        let lineDn = (P.y) * mult;
        ctx.moveTo(...pointToCtx(vals, P.x, P.y));
        ctx.lineTo(...pointToCtx(vals, P.x, P.y + lineUp));
        ctx.moveTo(...pointToCtx(vals, P.x, P.y));
        ctx.lineTo(...pointToCtx(vals, P.x, P.y - lineDn));
        ctx.stroke();
        drawDot(vals, P.x, P.y, 'black');
        drawDot(vals, Q.x, Q.y, 'red');
    };
    function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            ctx.beginPath();
            ctx.save();
            if (!finished.label) {
                markState('label', timestamp);
                labelPoint(ctx, vals, nP, P, labelOptions);
                if (nQ !== nP) {
                    labelPoint(ctx, vals, nQ, Q, labelOptions);
                }
                finished.label = timestamp;
            } else if (!finished.tangent) {
                let instate = markState('tangent', timestamp);
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                let mult = (timestamp - started.tangent) / duration.tangent;
                drawFullVertLine(mult);
                if (instate > duration.tangent) {
                    finished.tangent = timestamp;
                    ctx.setLineDash([]);
                }
            } else if (!finished.tanPause) {
                let instate = markState('tanPause', timestamp);
                if (instate > duration.tanPause) {
                    finished.tanPause = timestamp;
                }
            } else if (!finished.line) {
                let instate = markState('line', timestamp);
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = 2;
                let mult = (timestamp - started.line) / duration.line;
                drawFullVertLine(mult);
                if (instate > duration.line) {
                    finished.line = timestamp;
                }
            } else if (!finished.linePause) {
                let instate = markState('linePause', timestamp);
                if (instate > duration.linePause) {
                    finished.linePause = timestamp;
                }
            } else if (!finished.infinite) {
                markState('infinite', timestamp);
                // noinspection JSUnresolvedVariable
                const r = ctx.canvas._ratio || 1;
                const wide = vals.marginWide, thin = vals.marginThin;
                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.fillStyle = 'red';
                const fontPx = 80;
                ctx.font = `italic ${fontPx}px sans`;
                const left = r * wide + (vals.w - r * wide - r * thin) / 2 - fontPx / 2;
                const down = r * thin + (vals.h - r * wide - r * thin) / 2 + 0.8 * fontPx / 2;
                ctx.fillText(INFINITY, left, down);
                ctx.strokeText(INFINITY, left, down);
                finished.infinite = timestamp;
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
            if (drawDoneCb) drawDoneCb(R);
        } else {
            ctx['_frame'] = requestAnimationFrame(step);
        }
    }
    ctx['_frame'] = requestAnimationFrame(step);
    return R;
}

/**
 * Quickly animate the calculation of P, 2P, 4P, ... to limitP
 * @param ctx {CanvasRenderingContext2D}
 * @param limit {Number} the highest nP to show
 * @param basePoint {Point?} the base point (default P)
 * @param basePointLabel {String?} the label for the base point (default 'P')
 */
function quickDoubles(ctx, limit, basePoint, basePointLabel) {
    basePoint = basePoint || curve.P();
    basePointLabel = basePointLabel || 'P';
    const vals = preCalcValues(ctx);
    let start, prev;

    let workingOn = 2;
    const pValues = [];
    for (let n = 1; n <= limit; n *= 2) {
        pValues[n] = curve.pointMult(basePoint, n);
    }
    const prevPoints = {1: pValues[1]};

    const started = {};
    const finished = {};
    const duration = {
        move: 500,
        pause: 100
    };

    let markState = (n, timestamp) => {
        started[n] = started[n] || timestamp;
        return timestamp - started[n];
    };

    return new Promise(success => {

        function step(timestamp) {
            if (!start) {
                start = timestamp;
            }
            if (timestamp !== prev) {
                if (workingOn > limit) {
                    return success();
                }
                ctx.beginPath();
                ctx.save();
                if (!finished[workingOn]) {
                    let instate = markState(workingOn, timestamp);
                    let lastPoint = pValues[workingOn/2];
                    let thisPoint = pValues[workingOn];
                    let mult = instate / duration.move;
                    mult = Math.min(1.0, mult);
                    mult = common.easeInOut(mult);
                    let midPoint = {
                        x: lastPoint.x + (thisPoint.x - lastPoint.x) * mult,
                        y: lastPoint.y + (thisPoint.y - lastPoint.y) * mult,
                    };
                    resetGraph(ctx);
                    drawAndLabelPoints(ctx, vals, prevPoints, {label: basePointLabel});
                    drawDot(vals, midPoint.x, midPoint.y, 'orange');
                    if (mult >= 1.0) {
                        finished[workingOn] = timestamp;
                        prevPoints[workingOn] = pValues[workingOn];
                        resetGraph(ctx);
                        drawAndLabelPoints(ctx, vals, prevPoints, {label: basePointLabel});
                    }
                } else {
                    let instate = markState(`${workingOn}-pause`, timestamp);
                    if (instate > duration.pause) {
                        workingOn *= 2;
                        finished[`${workingOn}-pause`] = timestamp;
                    }
                }
                ctx.restore();
            }
            prev = timestamp;

            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                ctx['_frame'] = requestAnimationFrame(step);
            } else {
                ctx.canvas.click();
            }
        }
        ctx['_frame'] = requestAnimationFrame(step);
    });
}

/**
 * @param ctx
 * @param updateCb {Function?} callback to run after each point is calculated (before animation)
 * @param drawDoneCb {Function?} callback to run after animation is finished
 * @param nQ {Number?} optional nP value of Q
 * @param Q {Point?} optional starting point
 */
async function runAddPDemo(ctx, nQ, Q, updateCb, drawDoneCb) {
    resetGraph(ctx, true);
    let next = async () => {
        Q = await addPointsAnimation(ctx, 1, curve.P(), nQ, Q, {
            coords: true,
            labels: {1: curve.P()},
            drawDoneCb: (nR, R) => {
                if (drawDoneCb) drawDoneCb(nR, R);
                if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                    ctx['_timeout'] = setTimeout(() => { next() }, 1.5 * 1000);
                    return true;
                } else {
                    ctx.canvas.click();
                    return false;
                }
            }
        });
        nQ++;
        if (updateCb) updateCb(nQ, Q);
    };
    await next();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickGoodDoubleAddNumber() {
    let result = 0;
    const picks = [0, 0, 0, 1, 1, 1];
    shuffleArray(picks);
    for (let i = 0; i <= 5; i++) {
        if (picks[i]) {
            result += 2**i;
        }
    }
    result += Math.random() > 0.5 ? 2 ** 7 : 2 ** 6;
    return result;
}

/**
 * Checks the list of added points and re-orders them if necessary to avoid landing on the infinite point.
 * @param nums {Array[Number]} list of points to add, in the order they'll be added. shuffled in-place if necessary
 * @param basePoint {Point} base point
 * @return {Array[Number]} reference to nums
 */
function shuffleIfNecessary(nums, basePoint) {
    let safeOrder;
    for (let attempt = 0; attempt < 10; attempt++) {
        let P = null;
        let i;
        for (i = 0; i < nums.length; i++) {
            let Q = curve.pointMult(basePoint, nums[i]);
            if (!Q || !curve.pointAdd(P, Q)) {
                break;
            }
            P = curve.pointAdd(P, Q);
        }
        safeOrder = (i >= nums.length);
        if (safeOrder) {
            break;
        } else {
            shuffleArray(nums);
        }
    }
    if (!safeOrder) {
        if (console) {
            console.warn(`Unable to find a working order of ${JSON.stringify([basePoint, nums])}`);
        }
    }
    return nums;
}

/**
 * Animate a double-and-add.
 * @param ctx {CanvasRenderingContext2D}
 * @param n {Number} number of points to
 * @param P {Point} base point
 * @param label {String?} the label for base point (default 'P')
 * @param caption {HTMLSpanElement?}
 * @return {Promise<Point>} the calculated point
 */
function doubleAndAddAnimation(ctx, n, P, label, caption) {
    resetGraph(ctx);
    label = label || 'P';
    caption = caption || document.createElement('span');
    const vals = preCalcValues(ctx);

    return new Promise(success => {
        const minBits = Math.floor(Math.log2(n));
        caption.innerHTML = `Doubling point repeatedly to find 2${label} through ${2**minBits}${label}`;
        quickDoubles(ctx, 2**minBits, P, label).then(async () => {
            const points = {};
            let runningTotal = 0;
            for (let exp = 0, x = n; exp <= minBits; exp++, x >>= 1) {
                if ((x & 1) !== 0) {
                    points[2**exp] = curve.pointMult(P, 2**exp);
                }
            }

            // make sure we never land on the base point's order (infinity)
            let pointsToAdd = Object.keys(points).map(i => { return Number(i) });
            pointsToAdd = shuffleIfNecessary(pointsToAdd, P);

            resetGraph(ctx);
            drawAndLabelPoints(ctx, vals, points, {label});
            await common.sleep(1000, ctx);
            while (pointsToAdd.length) {
                if (!runningTotal) {
                    runningTotal = pointsToAdd.shift();
                    continue;
                }
                const n = pointsToAdd.shift();
                caption.innerText = `Adding ${runningTotal}${label} to ${n}${label} ` +
                    `to find ${n+runningTotal}${label}`;
                const tot = runningTotal;
                await new Promise(resolve => {
                    addPointsAnimation(ctx, n, points[n], tot, points[tot], {
                        basePointLabel: label,
                        removeInputs: true,
                        labels: points,
                        drawDoneCb: () => { resolve() }
                    });
                });
                runningTotal += n;
                points[runningTotal] = curve.pointMult(P, runningTotal);
                caption.innerText = `Result is ${runningTotal}${label}`;
            }
            success(points[runningTotal]) ;
        });
    });
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param captionTag {HTMLSpanElement}
 * @param updateCb {Function?} called after target nP value selected
 * @param drawDoneCb {Function?} called after animation is finished
 */
async function runDoubleAddDemo(ctx, captionTag, updateCb, drawDoneCb) {
    resetGraph(ctx, true);

    let cycle = async () => {
        const numToReach = pickGoodDoubleAddNumber();
        if (updateCb) updateCb(numToReach);
        await doubleAndAddAnimation(ctx, numToReach, P(), 'P', captionTag);
        if (drawDoneCb) drawDoneCb();
        if (common.canvasIsScrolledIntoView(ctx.canvas)) {
            ctx['_timeout'] = setTimeout(cycle, 2500);
        } else {
            ctx.canvas.click();
        }
    };
    await cycle();
}

/**
 * Run the first half of the 'key exchange' demo.
 * @param ctx {CanvasRenderingContext2D}
 * @param privKey {Number} private key
 * @param myLabel {String} label for my pubkey
 * @param actor {String} actor name
 * @param actorTag {HTMLDivElement} actor description tag
 */
async function runExchangePubkeyDemo(ctx, privKey, myLabel, actor, actorTag) {
    const vals = preCalcValues(ctx);
    common.cancelAnimation(ctx);

    actorTag.textContent = `${actor} multiplies P by their private key (${privKey})` +
        ` to find their public key, ${myLabel}:`;
    const pubkey = await doubleAndAddAnimation(ctx, privKey, P(), 'P');
    await common.sleep(1000, ctx);
    actorTag.textContent = `${actor} gives their public key (${myLabel}) to the other party.`;
    resetGraph(ctx);
    drawAndLabelPoints(ctx, vals, {1: pubkey}, {label: myLabel, coords: true});
    return pubkey;
}

/**
 * Run the second half of the 'key exchange' demo.
 * @param ctx {CanvasRenderingContext2D}
 * @param privKey {Number} private key
 * @param pubKey {Point} public key of other party
 * @param theirLabel {String} label for their pubkey
 * @param actor {String} actor name
 * @param actorTag {HTMLDivElement} actor description tag
 * @param theirPrivKey {Number} other actor's private key (for illus. purposes)
 */
async function runExchangeMultDemo(ctx, privKey, pubKey, theirLabel, actor, actorTag, theirPrivKey) {
    const vals = preCalcValues(ctx);
    common.cancelAnimation(ctx);

    actorTag.textContent = `${actor} multiplies ${theirLabel} by their private key (${privKey}):`;
    const R2 = await doubleAndAddAnimation(ctx, privKey, pubKey, theirLabel);
    resetGraph(ctx);
    actorTag.textContent = `${actor} has found the shared secret: ${privKey}${theirLabel} is ${privKey}×${theirPrivKey}P is (${R2.x}, ${R2.y})`;
    drawAndLabelPoints(ctx, vals, {[privKey]: R2}, {label: theirLabel, coords: true});
}

function labelIdleGraph(ctx, text) {
    const vals = preCalcValues(ctx);
    resetGraph(ctx);
    common.addGreyMask(ctx);
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '20px Helvetica, Arial, sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = '#333';
    const loc = pointToCtx(vals, field.p / 2, field.p / 2);
    ctx.strokeText(text, ...loc);
    ctx.fillText(text, ...loc);
    ctx.restore();
}

async function runExchangeDemo(alice, bob) {
    const ka = alice.input.value;
    const kb = bob.input.value;

    await labelIdleGraph(bob.ctx, 'Waiting for contact from Alice');
    const A = await runExchangePubkeyDemo(alice.ctx, ka, 'A', 'Alice', alice.desc);
    const B = await runExchangePubkeyDemo(bob.ctx, kb, 'B', 'Bob', bob.desc);
    await common.sleep(3000);
    await runExchangeMultDemo(alice.ctx, ka, B, 'B', 'Alice', alice.desc, kb);
    await common.sleep(1000);
    await runExchangeMultDemo(bob.ctx, kb, A, 'A', 'Bob', bob.desc, ka);
}

export {
    INFINITY,
    P,
    resetGraph,
    runAddPDemo,
    runDoubleAddDemo,
    runExchangeDemo,
    labelIdleGraph,
};
