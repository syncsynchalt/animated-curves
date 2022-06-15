import * as curve from './sample-curve.js?bustin=1655260032';
import * as common from '../common.js?bustin=1655260032';

const EPS = 0.000001;

/**
 * @param ctx {CanvasRenderingContext2D}
 * @return {PreCalcVals}
 */
function preCalcValues(ctx) {
    const marginThin = 15;
    const marginWide = 25;
    const dotRadius = 2;
    const w = ctx.canvas.getBoundingClientRect().width;
    const h = ctx.canvas.getBoundingClientRect().height;
    const yMin = -3, yMax = 3;
    const xMin = -2, xMax = 3;
    const xSpan = xMax - xMin, ySpan = yMax - yMin;
    return {
        ctx, marginThin, marginWide, w, h, dotRadius,
        xMin, xMax, yMin, yMax, xSpan, ySpan
    };
}

/**
 * Given an x,y point in the graph return the coordinates transformed for the JS Canvas context
 * (adjusted for top-left origin and half-pixel anti-aliasing)
 *
 * @param vals {PreCalcVals}
 * @param x {Number} between 0 and p
 * @param y {Number} between 0 and p
 * @param halfPixel {Boolean?} if set, round all pixels to nearest .5 (true) or .0 (false)
 * @return {Number[2]} x,y values transformed for canvas context
 */
function pointToCtx(vals, x, y, halfPixel) {
    let v = [(x - vals.xMin) / vals.xSpan * vals.w,
        vals.h - ((y - vals.yMin) / vals.ySpan * vals.h)];
    if (halfPixel) {
        v[0] = ((v[0]+0.5) | 0) - 0.5;
        v[1] = ((v[1]+0.5) | 0) - 0.5;
    } else if (halfPixel === false) {
        v[0] = ((v[0]+0.5) | 0);
        v[1] = ((v[1]+0.5) | 0);
    }
    return v;
}

/**
 * Draw the x/y axes and ticks
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {PreCalcVals}
 */
function drawAxes(ctx, vals) {
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(...pointToCtx(vals, vals.xMin, 0, true));
    ctx.lineTo(...pointToCtx(vals, vals.xMax, 0, true));
    ctx.moveTo(...pointToCtx(vals, 0, vals.yMin, true));
    ctx.lineTo(...pointToCtx(vals, 0, vals.yMax, true));
    for (let i = Math.floor(vals.xMin); i <= vals.xMax; i++) {
        const p = pointToCtx(vals, i, 0, true);
        ctx.moveTo(p[0], p[1]-2);
        ctx.lineTo(p[0], p[1]+2);
    }
    for (let i = Math.floor(vals.yMin); i <= vals.yMax; i++) {
        const p = pointToCtx(vals, 0, i, true);
        ctx.moveTo(p[0]-2, p[1]);
        ctx.lineTo(p[0]+2, p[1]);
    }
    ctx.stroke();
}

/**
 * @typedef {{x: Array, y: Array, a: Number?, b: Number?}} GraphData
 */

/**
 * Draw a particular curve given A and B
 * @param ctx {CanvasRenderingContext2D}
 * @param a {Number} curve parameter
 * @param b {Number} curve parameter
 * @return {GraphData}
 */
function generateGraph(ctx, a, b) {
    const vals = preCalcValues(ctx);
    let pX = [];
    let pY = [];
    let curHasData = false;
    const stepVal = 0.04;
    for (let x = vals.xMin; x <= vals.xMax; x += stepVal) {
        let y = curve.yValPos(x, a, b);

        // detect discontinuities and fill in more fine-grained data
        if (!isNaN(y) !== curHasData) {
            for (let xx = x-stepVal; xx < x; xx += stepVal / 8) {
                let yy = curve.yValPos(xx, a, b);
                if (yy) {
                    pX.push(xx);
                    pY.push(yy);
                }
            }
            curHasData = !isNaN(y);
        }

        pX.push(x);
        pY.push(!isNaN(y) ? y : undefined);
    }
    return {x: pX, y: pY, a, b};
}

/**
 * Draw the graph data
 * @param ctx {CanvasRenderingContext2D}
 * @param vals {PreCalcVals}
 * @param data {GraphData} result from generateGraph()
 */
function drawGraph(ctx, vals, data) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawAxes(ctx, vals);
    let lastPoint = null;
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    for (let i = data.x.length - 1; i >= 0; i--) {
        if (!isNaN(data.y[i])) {
            const p = pointToCtx(vals, data.x[i], data.y[i]);
            if (lastPoint) {
                ctx.lineTo(...p);
            } else if (data.y[i] < 1) {
                // close the gap vertically
                ctx.moveTo(...pointToCtx(vals, data.x[i], -data.y[i]));
                ctx.lineTo(...p);
            } else {
                ctx.moveTo(...p);
            }
            lastPoint = p;
        } else {
            if (lastPoint) {
                // close the gap vertically
                const p = pointToCtx(vals, data.x[i + 1], -data.y[i + 1] );
                ctx.lineTo(...p);
            }
            lastPoint = null;
        }
    }
    for (let i = 0; i < data.x.length; i++) {
        if (!isNaN(data.y[i])) {
            const p = pointToCtx(vals, data.x[i], -data.y[i]);
            if (lastPoint) {
                ctx.lineTo(...p);
            } else {
                ctx.moveTo(...p);
            }
            lastPoint = p;
        } else {
            lastPoint = null;
        }
    }
    ctx.stroke();
}

/**
 * Change to the next graph, in snake order.
 * @param state {{a, b, aDir, bDir}} graph state to mutate
 */
function mutateGraph(state) {
    state.aDir = state.aDir || 1;
    state.bDir = state.bDir || 1;
    if (state.b + state.bDir > 2 || state.b + state.bDir < -1) {
        state.bDir *= -1;
        if (state.a + state.aDir > 1 || state.a + state.aDir < -2) {
            state.aDir *= -1;
        }
        state.a += state.aDir;
    } else {
        state.b += state.bDir;
    }
}

/**
 * Write the equation of the graph.
 * @param ctx {CanvasRenderingContext2D}
 * @param curveData {GraphData}
 */
function writeEquation(ctx, curveData) {
    ctx.save();
    ctx.font = common.mathFont('1.2em');
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'black';
    let sign = (x) => {return x >= 0 ? '+' : '-'};
    const a = curveData.a, b = curveData.b;
    ctx.fillText(`y² = x³ ${sign(a)} ${Math.abs(a)}x ${sign(b)} ${Math.abs(b)}`, 20, 12);
    ctx.restore();
}

/**
 * Fill in any missing points in two GraphData sets until they have matching point arrays.
 *
 * This function assumes missing data is never on the ends of the arrays.
 *
 * @param data1 {GraphData} data for curve 1, modified in-place
 * @param data2 {GraphData} data for curve 2, modified in-place
 */
function annealGraphData(data1, data2) {
    let combinedX = [];
    let newY1 = [];
    let newY2 = [];

    for (let i = 0, j = 0; i < data1.x.length && j < data2.x.length; i++, j++) {
        while (!isNaN(data1.x[i]) && data1.x[i] < data2.x[j]) {
            combinedX.push(data1.x[i]);
            newY1.push(data1.y[i]);
            newY2.push(curve.yValPos(data1.x[i], data2.a, data2.b));
            i++;
        }
        while (!isNaN(data2.x[j]) && data2.x[j] < data1.x[i]) {
            combinedX.push(data2.x[j]);
            newY1.push(curve.yValPos(data2.x[j], data1.a, data1.b));
            newY2.push(data2.y[j]);
            j++;
        }
        combinedX.push(data1.x[i]);
        newY1.push(data1.y[i]);
        newY2.push(data2.y[j]);
    }
    data1.x = combinedX;
    data1.y = newY1;
    data2.x = combinedX;
    data2.y = newY2;
}

/**
 * Generate a datapoint of morphing from point A to point B
 * @param morphMult {Number} how much to morph from A to B
 * @param data {GraphData} dataset to append to
 * @param x {Number} x-coordinate for points A and B
 * @param yA {Number} y-coordinate for point A
 * @param yB {Number} y-coordinate for point B
 */
function appendMorphData(morphMult, data, x, yA, yB) {
    if (isNaN(yA) && isNaN(yB)) {
        data.x.push(x);
        data.y.push(undefined);
    } else {
        if (isNaN(yB) && isNaN(yB)) {
            // accelerate expand or collapse of missing curve data
            morphMult *= 1.5;
        }
        morphMult = common.easeInOut(morphMult);
        let a = yA || 0;
        let b = yB || 0;
        let diff = (b - a) * morphMult;
        data.x.push(x);
        if (isNaN(yB) && (a + diff) < EPS) {
            data.y.push(undefined);
        } else {
            data.y.push(a + diff);
        }
    }
}

/**
 * Draw a morph from one graph dataset to another
 * @param ctx {CanvasRenderingContext2D}
 * @param data1 {GraphData} first graph
 * @param data2 {GraphData} second graph
 * @param drawDoneCb {Function} called when animation is finished
 */
function morphGraph(ctx, data1, data2, drawDoneCb) {
    const vals = preCalcValues(ctx);
    let start, prev;

    // fill in any missing points in each dataset (due to discontinuity data)
    let d1 = {...data1};
    let d2 = {...data2};
    annealGraphData(d1, d2);

    const started = {};
    const finished = {};
    const duration = {
        morph: 500,
    };

    let markState = (state, timestamp) => {
        started[state] = started[state] || timestamp;
        return timestamp - started[state];
    };

    async function step(timestamp) {
        if (!start) {
            start = timestamp;
        }
        if (timestamp !== prev) {
            ctx.beginPath();
            ctx.save();
            if (!finished['draw1']) {
                markState('drawA', timestamp);
                drawGraph(ctx, vals, data1);
                finished.draw1 = timestamp;
            } else if (!finished['morph']) {
                let instate = markState('morph', timestamp);
                let mult = instate / duration.morph;
                mult = Math.min(1.0, mult);
                let d3 = {x: [], y: []};
                for (let i = 0; i < d1.x.length; i++) {
                    appendMorphData(mult, d3, d1.x[i], d1.y[i], d2.y[i]);
                }
                drawGraph(ctx, vals, d3);
                if (mult >= 1.0) {
                    finished.morph = timestamp;
                }
            } else if (!finished.draw2) {
                markState('draw2', timestamp);
                drawGraph(ctx, vals, data2);
                finished.draw2 = timestamp;
            } else if (!finished.done) {
                markState('done', timestamp);
                finished.done = timestamp;
            }
        }

        if (finished.done) {
            drawDoneCb();
        } else {
            ctx['_frame'] = requestAnimationFrame(step);
        }
    }
    ctx['_frame'] = requestAnimationFrame(step);
}

/**
 * Run the demo.
 * @param ctx {CanvasRenderingContext2D}
 * @param a {Number} curve parameter
 * @param b {Number} curve parameter
 * @param updateCb {Function} called every step
 */
async function runDemo(ctx, a, b, updateCb) {
    let state = {a, b};
    let d1 = generateGraph(ctx, state.a, state.b);
    let step = async () => {
        mutateGraph(state);
        updateCb(state.a, state.b);
        let d2 = generateGraph(ctx, state.a, state.b);
        morphGraph(ctx, d1, d2, async () => {
            d1 = d2;
            writeEquation(ctx, d1);
            if (common.canvasIsScrolledIntoView(ctx.canvas)) {
                ctx['_timeout'] = setTimeout(step, 2.0 * 1000);
            } else {
                ctx.canvas.click();
            }
        });
    };
    await step();
}

export {
    annealGraphData,
    mutateGraph,
    runDemo,
};
