import * as curve from './curve.js';
import * as field from './field.js';
const TWO_PI = 2*Math.PI;

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
    for (let i = greyWidth; i <= field.p; i += greyWidth) {
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

function drawDot(vals, x, y) {
    const ctx = vals.ctx;
    ctx.beginPath();
    ctx.moveTo(...pointToCtx(vals, x, y));
    ctx.arc(...pointToCtx(vals, x, y), vals.dotRadius, 0, TWO_PI);
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
    for (let x = 1; x < field.p; x++) {
        let yVals = curve.Y(x);
        if (yVals) {
            drawDot(vals, x, yVals[0]);
            drawDot(vals, x, yVals[1]);
        }
    }
    ctx.fillStyle = origFill;
}

export {
    drawGrid,
    drawCurve
};
