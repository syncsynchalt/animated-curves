import * as curve from './curve.js';
import * as field from './field.js';
import * as misc from './draw-misc.js';
import * as common from '../common.js';

const TWO_PI = 2*Math.PI;
const EPS = 0.0000001;
const INFINITY = '\u221E';

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
 * @param vals {Object} values from preCalcValues(ctx)
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
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(...pointToCtx(vals, 0, 0, true));
    ctx.lineTo(...pointToCtx(vals, field.p, 0, true));
    ctx.moveTo(...pointToCtx(vals, 0, 0, true));
    ctx.lineTo(...pointToCtx(vals, 0, field.p, true));
    ctx.stroke();
    ctx.font = 'italic 12px serif';
    ctx.fillStyle = 'black';
    const bodge = 1.6;
    ctx.fillText('0', ...pointToCtx(vals, -bodge, -bodge, false));
    ctx.fillText('p', ...pointToCtx(vals, -bodge, field.p - 0.5, false));
    ctx.fillText('p/2', ...pointToCtx(vals, -1.5*bodge, field.p/2 - 0.5, false));
    ctx.fillText('p', ...pointToCtx(vals, field.p - 0.5, -bodge, false));
    [10, 20, 30, 40, 50].forEach(x => {
        ctx.fillText(x, ...pointToCtx(vals, x-1, -bodge));
    });
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

let resetSaveState = null;

async function resetGraph(ctx) {
    if (animationFrameInProgress) {
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
        drawCurve(ctx);
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

    drawGreyLines(ctx, vals);
    drawAxisLines(ctx, vals);
    drawArrowHeads(ctx, vals);
}

let setAnimationFrame = (func) => {
    if (animationFrameInProgress) {
        cancelAnimationFrame(animationFrameInProgress);
    }
    animationFrameInProgress = func();
};

/**
 * @param vals {Object} return from cacheVals
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
    ctx.moveTo(...pointToCtx(vals, x, y, true));
    ctx.arc(...pointToCtx(vals, x, y, true), vals.dotRadius + (radiusAdj || 0), 0, TWO_PI);
    ctx.stroke();
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
    const origFill = ctx.fillStyle;
    ctx.fillStyle = 'lightblue';
    for (let x = 0; x < field.p; x++) {
        let yVals = curve.Y(x);
        if (yVals) {
            drawDot(vals, x, yVals[0], 'lightblue');
            drawDot(vals, x, yVals[1], 'lightblue');
        }
    }
    ctx.fillStyle = 'black';
    let P = curve.P();
    drawDot(vals, P.x, P.y, 'black');
    ctx.fillStyle = origFill;
}

let animationFrameInProgress;

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param Q {Point} the current point 'Q', to which 'P' will be added
 * @param drawDoneCb {Function?} optional callback when done drawing
 */
async function addP(ctx, Q, drawDoneCb) {
    if (animationFrameInProgress) {
        await resetGraph(ctx);
    }
    const vals = preCalcValues(ctx);
    let start, prev;

    const P = curve.P();
    if (Q === undefined) {
        Q = P;
    } else if (Q === null) {
        // reset back to P
        const R = P;
        await resetGraph(ctx);
        drawDot(vals, P.x, P.y, 'red');
        if (drawDoneCb) {
            setTimeout(() => { drawDoneCb(R) }, 0);
        }
        return R;
    }
    const R = curve.pointAdd(P, Q);
    if (R === null) {
        return drawInfinity(ctx, P, Q, drawDoneCb);
    }
    const negR = curve.negate(R);
    const slope = misc.getSlope(P, Q);

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

    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            ctx.save();
            if (!finished['tangent']) {
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
                    [cache.lineLastP, _x] = misc.orderPointsByX(P, Q);
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
                    cache.negLength = curve.negate(R).y - R.y;
                }
                let mult = instate / duration.negate;
                mult = Math.min(1, mult);
                mult = common.easeInOut(mult);
                ctx.moveTo(...pointToCtx(vals, negR.x, negR.y, true));
                ctx.lineTo(...pointToCtx(vals, negR.x, negR.y - cache.negLength * mult, true));
                ctx.stroke();
                ctx.setLineDash([]);
                // overdraw to fix red line covering this dot
                drawDot(vals, negR.x, negR.y, 'orange', +1, 1);
                if (instate > duration.negate) {
                    ctx.strokeStyle = 'black';
                    drawDot(vals, Q.x, Q.y, 'orange');
                    drawDot(vals, R.x, R.y, 'red', +1, 2);
                    finished.negate = timestamp;
                }
            } else if (!finished.callback) {
                markState('callback', timestamp);
                if (drawDoneCb) {
                    cache.stopAnimation = drawDoneCb(R) === false;
                }
                finished.callback = timestamp;
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
            await resetGraph(ctx);
            drawDot(vals, R.x, R.y, 'red');
        } else if (!cache.stopAnimation) {
            setAnimationFrame(() => { return requestAnimationFrame(step) });
        }
    }
    setAnimationFrame(() => { return requestAnimationFrame(step) });
    return R;
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param P {Point} the current point 'P'
 * @param Q {Point} the current point 'Q' (assumed has same x-coord as P)
 * @param drawDoneCb {Function?} optional callback when done drawing
 */
async function drawInfinity(ctx, P, Q, drawDoneCb) {
    const vals = preCalcValues(ctx);
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
    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            if (!finished['tangent']) {
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
            } else if (!finished.callback) {
                markState('callback', timestamp);
                if (drawDoneCb) drawDoneCb(R);
                finished.callback = timestamp;
            } else if (!finished.done) {
                let instate = markState('done', timestamp);
                if (instate > duration.done) {
                    finished.done = timestamp;
                }
            }
        }
        prev = timestamp;

        if (!finished.done) {
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
 * @param Q {Point?} optional starting point
 */
async function runDemo(ctx, updateCb, drawDoneCb, Q) {
    await resetGraph(ctx);
    let next = async () => {
        Q = await addP(ctx, Q, (R) => {
            if (drawDoneCb) drawDoneCb(R);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                demoTimeout = setTimeout(() => { next() }, 1.5 * 1000);
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

export {
    INFINITY,
    resetGraph,
    addP,
    runDemo,
    cancelDemo,
};
